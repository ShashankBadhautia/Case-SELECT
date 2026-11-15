import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { config } from "../config/index.js";

/**
 * One connection pool and one Prisma client for the whole API.
 *
 * The generated client is TypeScript, so it is imported lazily: Node strips
 * the types at load time (see "Prerequisites" in README.md).
 */

let pool = null;
let prisma = null;

/** Shared pg pool. Used directly by the player SQL runner, and by Prisma. */
export function getPool() {
  if (!pool) {
    pool = new Pool({ connectionString: config.databaseUrl });
  }
  return pool;
}

export async function getPrisma() {
  if (!prisma) {
    const { PrismaClient } = await import("../../generated/prisma/client.ts");
    prisma = new PrismaClient({ adapter: new PrismaPg(getPool()) });
  }
  return prisma;
}
