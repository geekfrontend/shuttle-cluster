import { RouteHandler } from "@/lib/route-handler";
import { clearSessionCookie, getSession } from "@/server/auth/session";
import { logout } from "@/server/services/auth.service";
import { ApiResponse } from "@/utils/api-response";

// Idempoten: tanpa session pun tetap membersihkan cookie.
export const POST = RouteHandler(async () => {
  const session = await getSession();
  if (session) await logout(session);
  await clearSessionCookie();
  return ApiResponse.ok("auth.logout_success");
});
