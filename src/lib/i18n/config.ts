export const LOCALES = ["id", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "id";

/** Header eksplisit dari klien; mengalahkan preferensi user dan Accept-Language. */
export const LOCALE_HEADER = "x-locale";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/** Normalisasi tag seperti "en-US" / "id_ID" ke locale yang didukung. */
export function toLocale(value: string | null | undefined): Locale | null {
  if (!value) return null;
  const base = value.trim().toLowerCase().split(/[-_]/)[0];
  return isLocale(base) ? base : null;
}

/** Pilih locale terbaik dari header Accept-Language (menghormati bobot q). */
export function matchAcceptLanguage(header: string | null | undefined): Locale | null {
  if (!header) return null;

  const candidates = header
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.find((p) => p.trim().startsWith("q="));
      return { tag, weight: q ? Number(q.trim().slice(2)) : 1 };
    })
    .filter((c) => c.tag && !Number.isNaN(c.weight) && c.weight > 0)
    .sort((a, b) => b.weight - a.weight);

  for (const { tag } of candidates) {
    const locale = toLocale(tag);
    if (locale) return locale;
  }
  return null;
}
