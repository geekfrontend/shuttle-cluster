import { RouteHandler } from "@/lib/route-handler";
import { requireSession } from "@/server/auth/session";
import { getLocale } from "@/server/i18n";
import { ApiResponse } from "@/utils/api-response";

export const GET = RouteHandler(async () => {
  const session = await requireSession({ allowPasswordChangePending: true });
  return ApiResponse.ok("auth.session_active", {
    user: session.user,
    expiresAt: session.expiresAt,
    locale: await getLocale(),
  });
});
