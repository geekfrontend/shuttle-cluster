import { RouteHandler } from "@/lib/route-handler";
import { validateRequest } from "@/lib/validate-request";
import { requireAdmin } from "@/server/auth/session";
import { deleteMatch } from "@/server/services/match.service";
import { ApiResponse } from "@/utils/api-response";
import { uuidSchema } from "@/validations/common.schema";

export const DELETE = RouteHandler<{ id: string }>(async (_req, { params }) => {
  const session = await requireAdmin();
  const id = await validateRequest(uuidSchema, (await params).id);
  await deleteMatch(session, id);
  return ApiResponse.ok("matches.deleted");
});
