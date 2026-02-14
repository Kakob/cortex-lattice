/**
 * =============================================================================
 * CORTEX LATTICE - PRISMA CLIENT SINGLETON
 * =============================================================================
 *
 * This module creates and exports a single Prisma Client instance.
 *
 * WHY A SINGLETON?
 * ----------------
 * In development, Next.js uses hot module reloading (HMR). Without special
 * handling, each HMR cycle would create a new PrismaClient, eventually
 * exhausting the database connection pool and causing errors like:
 *
 *   "Too many clients already"
 *   "Connection pool exhausted"
 *
 * The solution: Store the client on globalThis, which persists across HMR.
 *
 * HOW IT WORKS:
 * -------------
 * 1. Check if a PrismaClient already exists on globalThis
 * 2. If not, create a new one with appropriate logging settings
 * 3. In development, save it to globalThis for reuse
 * 4. In production, we don't save to globalThis (no HMR anyway)
 *
 * LOGGING:
 * --------
 * - Development: Logs queries, errors, and warnings (helps debug SQL issues)
 * - Production: Logs only errors (reduces noise in production logs)
 *
 * USAGE:
 * ------
 * import { prisma } from '@/lib/db';
 *
 * const users = await prisma.user.findMany();
 * const problem = await prisma.studyProblem.create({ data: {...} });
 */

import { PrismaClient } from "@prisma/client";

/**
 * Extend globalThis with our prisma property.
 * This type assertion is needed because globalThis doesn't have a prisma
 * property by default.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * The singleton Prisma Client instance.
 *
 * Uses nullish coalescing (??): if globalForPrisma.prisma exists, use it;
 * otherwise, create a new PrismaClient.
 */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]  // Verbose logging in dev
        : ["error"],                   // Only errors in production
  });

/**
 * In non-production environments, save the client to globalThis.
 * This ensures the same instance is reused across hot reloads.
 */
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
