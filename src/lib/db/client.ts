import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

// Prisma 7 requires an explicit driver adapter at the PrismaClient
// constructor (schema.prisma can no longer carry a connection url).
// Netlify's provisioned Postgres (Netlify Database, powered by Neon) sets
// NETLIFY_DATABASE_URL rather than DATABASE_URL — fall back to it so the
// same build works on Vercel and Netlify without a manual env var alias.
const connectionString = process.env.DATABASE_URL ?? process.env.NETLIFY_DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set — point it at a Postgres instance (see README)."
  );
}

const adapter = new PrismaPg(connectionString);

declare global {
  var __prisma: PrismaClient | undefined;
}

export const prisma = globalThis.__prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = prisma;
}
