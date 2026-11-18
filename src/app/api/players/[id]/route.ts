import { RouteHandler } from "@/lib/route-handler";
import { readJson, validateRequest } from "@/lib/validate-request";
import { requireAdmin } from "@/server/auth/session";
import { deletePlayer, updatePlayer } from "@/server/services/player.service";
import { ApiResponse } from "@/utils/api-response";
import { uuidSchema } from "@/validations/common.schema";
import { updatePlayerSchema } from "@/validations/player.schema";

export const PATCH = RouteHandler<{ id: string }>(async (req, { params }) => {
  const session = await requireAdmin();
  const id = await validateRequest(uuidSchema, (await params).id);
  const input = await validateRequest(updatePlayerSchema, await readJson(req));
  return ApiResponse.ok("players.updated", await updatePlayer(session, id, input));
});

export const DELETE = RouteHandler<{ id: string }>(async (_req, { params }) => {
  const session = await requireAdmin();
  const id = await validateRequest(uuidSchema, (await params).id);
  await deletePlayer(session, id);
  return ApiResponse.ok("players.deleted");
});
