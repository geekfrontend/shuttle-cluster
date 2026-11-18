import { RouteHandler } from "@/lib/route-handler";
import { readQuery, validateRequest } from "@/lib/validate-request";
import { requireSession } from "@/server/auth/session";
import { runClustering } from "@/server/services/clustering.service";
import { ApiResponse } from "@/utils/api-response";
import { clusteringQuerySchema } from "@/validations/clustering.schema";

export const GET = RouteHandler(async (req) => {
  await requireSession();
  const params = await validateRequest(clusteringQuerySchema, readQuery(req));
  return ApiResponse.ok("clustering.result", await runClustering(params));
});
