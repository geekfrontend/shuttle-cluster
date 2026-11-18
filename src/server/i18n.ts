import { cache } from "react";

import { headers } from "next/headers";

import { DEFAULT_LOCALE, LOCALE_HEADER, type Locale, matchAcceptLanguage, toLocale } from "@/lib/i18n/config";
import { type MessageKey, type MessageParams, translate } from "@/lib/i18n/translate";
import type { MessageCatalog } from "@/lib/i18n/ui";
import { getSession } from "@/server/auth/session";

/**
 * Locale untuk request ini:
 * 1. header `X-Locale` (pilihan eksplisit klien)
 * 2. preferensi user yang login (`users.locale`)
 * 3. `Accept-Language`
 * 4. default `id`
 */
export const getLocale = cache(async (): Promise<Locale> => {
  const list = await headers();

  const explicit = toLocale(list.get(LOCALE_HEADER));
  if (explicit) return explicit;

  try {
    const session = await getSession();
    const preferred = toLocale(session?.user.locale);
    if (preferred) return preferred;
  } catch {
    // Session gagal dibaca (mis. DB down) — tetap lanjut dengan header.
  }

  return matchAcceptLanguage(list.get("accept-language")) ?? DEFAULT_LOCALE;
});

export async function t(key: MessageKey, params?: MessageParams): Promise<string> {
  return translate(await getLocale(), key, params);
}

/** Pesan UI sebuah fitur untuk locale request ini (Server Component / `generateMetadata`). */
export async function getMessages<T>(catalog: MessageCatalog<T>): Promise<T> {
  return catalog[await getLocale()];
}
