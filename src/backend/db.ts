import { PrismaClient } from "@prisma/client";

// Serverless (Vercel) va dev muhitlarida ortiqcha baza ulanishlari (connection pool leak)
// ochilmasligi uchun globalThis darajasida bitta PrismaClient nusxasi qayta ishlatiladi.
// Windows/ISP muhitlarida IPv6 -> IPv4 fallback va Neon cold-start uchun connect_timeout >= 25s ta'minlanadi.
function buildDatabaseUrl(): string | undefined {
  const raw = process.env.DATABASE_URL?.trim();
  if (!raw) return undefined;
  const extras: string[] = [];
  if (!raw.includes("connect_timeout=")) extras.push("connect_timeout=25");
  if (!raw.includes("pool_timeout=")) extras.push("pool_timeout=25");
  if (!raw.includes("connection_limit=")) extras.push("connection_limit=6");
  if (!raw.includes("keepalives=")) extras.push("keepalives=1");
  if (!raw.includes("keepalives_idle=")) extras.push("keepalives_idle=30");
  if (extras.length === 0) return raw;
  const sep = raw.includes("?") ? "&" : "?";
  return `${raw}${sep}${extras.join("&")}`;
}

function isTransientDisconnect(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const code = (err as { code?: unknown }).code;
  if (code === "P1017" || code === "P1001" || code === "P1002") return true;
  const msg = String((err as { message?: unknown }).message ?? "");
  return (
    msg.includes("Server has closed the connection") ||
    msg.includes("terminating connection due to administrator command") ||
    msg.includes("ConnectionReset")
  );
}

function createPrismaClient() {
  const resolvedDbUrl = buildDatabaseUrl();
  const base = new PrismaClient({
    ...(resolvedDbUrl ? { datasources: { db: { url: resolvedDbUrl } } } : {}),
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

  return base.$extends({
    query: {
      $allModels: {
        async $allOperations({ args, query }) {
          try {
            return await query(args);
          } catch (err) {
            if (isTransientDisconnect(err)) {
              await base.$disconnect().catch(() => undefined);
              return query(args);
            }
            throw err;
          }
        },
      },
    },
  });
}

type ExtendedPrismaClient = ReturnType<typeof createPrismaClient>;

const globalForPrisma = globalThis as unknown as {
  prismaExtended?: ExtendedPrismaClient;
};

export const db = globalForPrisma.prismaExtended ?? createPrismaClient();

globalForPrisma.prismaExtended = db;
