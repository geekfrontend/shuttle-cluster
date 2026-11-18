import { z } from "zod";

import { paginationSchema } from "@/lib/pagination";

import { csvListSchema, emailSchema, nameSchema, passwordSchema } from "./common.schema";

export const USER_ROLES = ["admin", "user"] as const;
export const USER_STATUSES = ["active", "locked", "deactivated"] as const;

export const userRoleSchema = z.enum(USER_ROLES);

export const listUsersQuerySchema = paginationSchema.extend({
  q: z.string().trim().max(120).optional(),
  role: csvListSchema(userRoleSchema),
  status: csvListSchema(z.enum(USER_STATUSES)),
});

export const createUserSchema = z
  .object({
    email: emailSchema,
    name: nameSchema,
    password: passwordSchema,
    role: userRoleSchema,
  })
  .strict();

/** `active` juga membuka akun yang terkunci; `deactivated` menutup akses dan mencabut semua session. */
export const updateUserSchema = z
  .object({
    name: nameSchema.optional(),
    role: userRoleSchema.optional(),
    status: z.enum(["active", "deactivated"]).optional(),
  })
  .strict();

export const resetPasswordSchema = z.object({ password: passwordSchema }).strict();
