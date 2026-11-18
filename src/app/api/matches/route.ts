import { RouteHandler } from "@/lib/route-handler";
import { readJson, readQuery, validateRequest } from "@/lib/validate-request";
import { requireAdmin, requireSession } from "@/server/auth/session";
import { createMatch, listMatches } from "@/server/services/match.service";
import { ApiResponse } from "@/utils/api-response";
import { createMatchSchema, listMatchesQuerySchema } from "@/validations/match.schema";

export const GET = RouteHandler(async (req) => {
  await requireSession();
  const { page, pageSize, ...filter } = await validateRequest(listMatchesQuerySchema, readQuery(req));
  return ApiResponse.ok("matches.list", await listMatches({ page, pageSize }, filter));
});

export const POST = RouteHandler(async (req) => {
  const session = await requireAdmin();
  const input = await validateRequest(createMatchSchema, await readJson(req));
  return ApiResponse.created("matches.created", await createMatch(session, input));
});
