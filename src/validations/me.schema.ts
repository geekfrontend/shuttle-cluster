import { z } from "zod";

import { localeSchema, nameSchema } from "./common.schema";

export const updateMeSchema = z
  .object({
    name: nameSchema.optional(),
    avatarUrl: z.url().max(2048).nullable().optional(),
    /** null = ikuti header request (X-Locale / Accept-Language). */
    locale: localeSchema.nullable().optional(),
  })
  .strict();
