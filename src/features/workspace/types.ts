import type { Locale } from "@/lib/i18n/config";

/** `null` = ikuti bahasa browser. */
export type UpdateLocaleRequest = { locale: Locale | null };
