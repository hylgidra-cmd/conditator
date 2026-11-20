import { PrismaClient } from "@prisma/client";

// Serverless (Vercel) va dev muhitlarida ortiqcha baza ulanishlari (connection pool leak)
// ochilmasligi uchun globalThis darajasida bitta PrismaClient nusxasi qayta ishlatiladi.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

globalForPrisma.prisma = db;
