import { RouteHandler } from "@/lib/route-handler";
import { readJson, validateRequest } from "@/lib/validate-request";
import { requireSession } from "@/server/auth/session";
import { getMe, updateMe } from "@/server/services/me.service";
import { ApiResponse } from "@/utils/api-response";
import { updateMeSchema } from "@/validations/me.schema";

export const GET = RouteHandler(async () => {
  const session = await requireSession();
  return ApiResponse.ok("me.profile", await getMe(session.user.id));
});

export const PATCH = RouteHandler(async (req) => {
  const session = await requireSession();
  const input = await validateRequest(updateMeSchema, await readJson(req));
  return ApiResponse.ok("me.updated", await updateMe(session.user.id, input));
});
