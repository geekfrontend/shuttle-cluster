import { rateLimit } from "@/lib/rate-limiter";
import { RouteHandler } from "@/lib/route-handler";
import { readJson, validateRequest } from "@/lib/validate-request";
import { getRequestMeta } from "@/server/request-meta";
import { login } from "@/server/services/auth.service";
import { ApiResponse } from "@/utils/api-response";
import { loginSchema } from "@/validations/auth.schema";

export const POST = RouteHandler(async (req) => {
  const meta = await getRequestMeta();
  rateLimit(`login:ip:${meta.ip ?? "unknown"}`, 20, 60_000);

  const input = await validateRequest(loginSchema, await readJson(req));
  rateLimit(`login:email:${input.email}`, 10, 60_000);

  const result = await login(input, meta);
  return ApiResponse.ok("auth.login_success", result);
});
