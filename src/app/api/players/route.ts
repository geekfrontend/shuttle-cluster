import { RouteHandler } from "@/lib/route-handler";
import { readJson, readQuery, validateRequest } from "@/lib/validate-request";
import { requireAdmin, requireSession } from "@/server/auth/session";
import { createPlayer, listPlayers } from "@/server/services/player.service";
import { ApiResponse } from "@/utils/api-response";
import { createPlayerSchema, listPlayersQuerySchema } from "@/validations/player.schema";

export const GET = RouteHandler(async (req) => {
  await requireSession();
  const { page, pageSize, ...filter } = await validateRequest(listPlayersQuerySchema, readQuery(req));
  return ApiResponse.ok("players.list", await listPlayers({ page, pageSize }, filter));
});

export const POST = RouteHandler(async (req) => {
  const session = await requireAdmin();
  const input = await validateRequest(createPlayerSchema, await readJson(req));
  return ApiResponse.created("players.created", await createPlayer(session, input));
});
