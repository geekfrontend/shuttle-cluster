import { RouteHandler } from "@/lib/route-handler";
import { refreshSession, requireSession } from "@/server/auth/session";
import { ApiResponse } from "@/utils/api-response";

export const POST = RouteHandler(async () => {
  const session = await requireSession({ allowPasswordChangePending: true });
  const { expiresAt } = await refreshSession(session);
  return ApiResponse.ok("auth.session_refreshed", { expiresAt });
});
