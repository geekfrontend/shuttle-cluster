import { RouteHandler } from "@/lib/route-handler";
import { readJson, readQuery, validateRequest } from "@/lib/validate-request";
import { requireAdmin } from "@/server/auth/session";
import { createUser, listUsers } from "@/server/services/user.service";
import { ApiResponse } from "@/utils/api-response";
import { createUserSchema, listUsersQuerySchema } from "@/validations/user.schema";

export const GET = RouteHandler(async (req) => {
  await requireAdmin();
  const { page, pageSize, ...filter } = await validateRequest(listUsersQuerySchema, readQuery(req));
  return ApiResponse.ok("users.list", await listUsers({ page, pageSize }, filter));
});

export const POST = RouteHandler(async (req) => {
  const session = await requireAdmin();
  const input = await validateRequest(createUserSchema, await readJson(req));
  return ApiResponse.created("users.created", await createUser(session, input));
});
