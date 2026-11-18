import { AUTH_CONFIG } from "@/config/auth-config";
import { rateLimit } from "@/lib/rate-limiter";
import { RouteHandler } from "@/lib/route-handler";
import { readJson, validateRequest } from "@/lib/validate-request";
import { requireSession } from "@/server/auth/session";
import { changePassword } from "@/server/services/auth.service";
import { ApiError } from "@/utils/api-error";
import { ApiResponse } from "@/utils/api-response";
import { changePasswordSchema } from "@/validations/auth.schema";

// Satu-satunya endpoint mutasi yang boleh dipakai selama `mustChangePassword`.
export const PATCH = RouteHandler(async (req) => {
  if (!AUTH_CONFIG.passwordChangeEnabled) throw ApiError.notFound();
  const session = await requireSession({ allowPasswordChangePending: true });
  rateLimit(`password:${session.user.id}`, 10, 15 * 60_000);

  const input = await validateRequest(changePasswordSchema, await readJson(req));
  await changePassword(session, input);
  return ApiResponse.ok("auth.password_changed");
});
