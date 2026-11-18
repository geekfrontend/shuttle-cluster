import { rateLimit } from "@/lib/rate-limiter";
import { RouteHandler } from "@/lib/route-handler";
import { readJson, validateRequest } from "@/lib/validate-request";
import { requireAdmin } from "@/server/auth/session";
import { resetPassword } from "@/server/services/user.service";
import { ApiResponse } from "@/utils/api-response";
import { uuidSchema } from "@/validations/common.schema";
import { resetPasswordSchema } from "@/validations/user.schema";

export const POST = RouteHandler<{ id: string }>(async (req, { params }) => {
  const session = await requireAdmin();
  rateLimit(`reset-password:${session.user.id}`, 20, 15 * 60_000);

  const id = await validateRequest(uuidSchema, (await params).id);
  const input = await validateRequest(resetPasswordSchema, await readJson(req));
  await resetPassword(session, id, input);
  return ApiResponse.ok("users.password_reset");
});
