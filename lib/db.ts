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

// Slow query threshold in ms — queries above this get a warning log
const SLOW_QUERY_THRESHOLD = parseInt(
  process.env.SLOW_QUERY_THRESHOLD || "200",
  10
);

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
 * Logging is configured via Prisma events so we can add timing and
 * slow-query detection on top of the default output.
 */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: [
      { emit: "event", level: "query" },
      { emit: "event", level: "error" },
      { emit: "event", level: "warn" },
      { emit: "stdout", level: "info" },
    ],
  });

// ── Query timing & slow-query detection ──────────────────────────────

prisma.$on("query" as never, (e: { query: string; params: string; duration: number }) => {
  const tag = e.duration >= SLOW_QUERY_THRESHOLD ? "[db] SLOW QUERY" : "[db] query";

  if (e.duration >= SLOW_QUERY_THRESHOLD) {
    console.warn(tag, {
      duration: `${e.duration}ms`,
      query: e.query.slice(0, 300),
      params: e.params.slice(0, 200),
    });
  } else if (process.env.NODE_ENV === "development") {
    console.log(tag, {
      duration: `${e.duration}ms`,
      query: e.query.slice(0, 200),
    });
  }
});

// ── Error logging ────────────────────────────────────────────────────

prisma.$on("error" as never, (e: { message: string; target?: string }) => {
  console.error("[db] ERROR", {
    message: e.message,
    target: e.target,
  });
});

// ── Warning logging ──────────────────────────────────────────────────

prisma.$on("warn" as never, (e: { message: string }) => {
  console.warn("[db] WARN", { message: e.message });
});

/**
 * In non-production environments, save the client to globalThis.
 * This ensures the same instance is reused across hot reloads.
 */
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
