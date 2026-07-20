import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@/generated/prisma/client";

// Prisma 7 requires an explicit driver adapter at the PrismaClient
// constructor (schema.prisma can no longer carry a connection url). Moving
// to Postgres later means swapping this adapter for @prisma/adapter-pg and
// pointing DATABASE_URL at the Postgres instance — the schema itself does
// not change.
const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});

declare global {
  var __prisma: PrismaClient | undefined;
}

export const prisma = globalThis.__prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = prisma;
}
