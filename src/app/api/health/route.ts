import { STATUS_CODES } from "@/constants/status-codes";
import { prisma } from "@/db/client";
import { RouteHandler } from "@/lib/route-handler";
import { ApiResponse } from "@/utils/api-response";
import { logger } from "@/utils/logger";

export const GET = RouteHandler(async () => {
  const startedAt = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    logger.error("Health check failed", { error: error instanceof Error ? error.message : String(error) });
    return ApiResponse.error("health.db_unavailable", STATUS_CODES.SERVICE_UNAVAILABLE);
  }
  return ApiResponse.ok("health.ok", { database: "up", latencyMs: Date.now() - startedAt });
});
