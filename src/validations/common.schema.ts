import { z } from "zod";

import { LOCALES } from "@/lib/i18n/config";
import { localized } from "@/lib/i18n/validation-message";

/*
 * Pesan validasi selalu dua bahasa (id/en, sesuai locale request):
 * - pesan bawaan zod (wajib diisi, panjang, tipe, email, uuid, …) diterjemahkan oleh error map locale di
 *   `validateRequest`, jadi JANGAN menulis teks pesan sendiri;
 * - aturan yang pesan bawaannya tidak ramah (mis. `regex` yang menampilkan pola mentah) memakai
 *   `localized("validation.…")` dengan kunci di `src/lib/i18n/messages/{en,id}.ts`.
 */

export const emailSchema = z.string().trim().toLowerCase().pipe(z.email().max(254));

/** Minimal 12 karakter. */
export const passwordSchema = z.string().min(12).max(128);

export const nameSchema = z.string().trim().min(1).max(120);

/** Tanggal ISO `YYYY-MM-DD`. */
export const dateSchema = z.iso.date(localized("validation.date"));

export const uuidSchema = z.uuid();

export const localeSchema = z.enum(LOCALES);

/**
 * Filter daftar multi-nilai dari query string, dipisah koma (`status=active,ended`). `readQuery` hanya
 * menyimpan satu nilai per kunci, jadi kunci berulang (`status=a&status=b`) tidak bisa dipakai.
 */
export function csvListSchema<T extends z.ZodType<string, string>>(item: T) {
  const values = item instanceof z.ZodEnum ? (item.options as string[]) : null;
  return z
    .string()
    .transform((value) =>
      value
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean),
    )
    .pipe(z.array(item).min(1).max(50))
    .optional()
    .meta({
      description: values
        ? `Satu atau beberapa nilai dipisah koma: ${values.map((value) => `\`${value}\``).join(", ")}.`
        : "Satu atau beberapa nilai dipisah koma.",
    });
}
