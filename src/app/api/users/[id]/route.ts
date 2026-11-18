import { RouteHandler } from "@/lib/route-handler";
import { readJson, validateRequest } from "@/lib/validate-request";
import { requireAdmin } from "@/server/auth/session";
import { updateUser } from "@/server/services/user.service";
import { ApiResponse } from "@/utils/api-response";
import { uuidSchema } from "@/validations/common.schema";
import { updateUserSchema } from "@/validations/user.schema";

export const PATCH = RouteHandler<{ id: string }>(async (req, { params }) => {
  const session = await requireAdmin();
  const id = await validateRequest(uuidSchema, (await params).id);
  const input = await validateRequest(updateUserSchema, await readJson(req));
  return ApiResponse.ok("users.updated", await updateUser(session, id, input));
});
