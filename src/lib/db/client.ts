import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

// Prisma 7 requires an explicit driver adapter at the PrismaClient
// constructor (schema.prisma can no longer carry a connection url).
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set — point it at a Postgres instance (see README).");
}

const adapter = new PrismaPg(process.env.DATABASE_URL);

declare global {
  var __prisma: PrismaClient | undefined;
}

export const prisma = globalThis.__prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = prisma;
}
