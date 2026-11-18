import { z } from "zod";

import { localized } from "@/lib/i18n/validation-message";
import { paginationSchema } from "@/lib/pagination";

import { csvListSchema, nameSchema } from "./common.schema";

export const GENDERS = ["male", "female"] as const;

export const genderSchema = z.enum(GENDERS);

/** Kode negara 3 huruf (IOC/BWF), mis. `INA`. */
export const countrySchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{3}$/, localized("validation.country"));

export const listPlayersQuerySchema = paginationSchema.extend({
  q: z.string().trim().max(120).optional(),
  gender: csvListSchema(genderSchema),
});

export const createPlayerSchema = z
  .object({
    name: nameSchema,
    gender: genderSchema,
    country: countrySchema.nullable().optional(),
    externalId: z.string().trim().min(1).max(64).nullable().optional(),
  })
  .strict();

export const updatePlayerSchema = createPlayerSchema.partial().strict();
