import type { NextRequest } from "next/server";

import type { z } from "zod";

import { validationErrors, zodErrorMap } from "@/lib/i18n/translate";
import { getLocale } from "@/server/i18n";
import { ApiError } from "@/utils/api-error";

/**
 * Validasi input dengan pesan error sesuai locale request (id/en): pesan bawaan zod lewat error map
 * locale, pesan kustom schema (`localized(...)`) lewat katalog pesan. Gagal → 400 dengan error per field.
 */
export async function validateRequest<S extends z.ZodType>(schema: S, data: unknown): Promise<z.infer<S>> {
  const locale = await getLocale();
  const result = schema.safeParse(data, { error: zodErrorMap(locale) });
  if (!result.success) {
    throw ApiError.badRequest("error.validation_failed", { errors: validationErrors(result.error, locale) });
  }
  return result.data;
}

export async function readJson(req: NextRequest): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    throw ApiError.badRequest("error.invalid_json");
  }
}

export function readQuery(req: NextRequest): Record<string, string> {
  return Object.fromEntries(req.nextUrl.searchParams);
}
