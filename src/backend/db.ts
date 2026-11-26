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
  if (extras.length === 0) return raw;
  const sep = raw.includes("?") ? "&" : "?";
  return `${raw}${sep}${extras.join("&")}`;
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
const resolvedDbUrl = buildDatabaseUrl();

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    ...(resolvedDbUrl ? { datasources: { db: { url: resolvedDbUrl } } } : {}),
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

globalForPrisma.prisma = db;
