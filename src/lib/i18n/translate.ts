import { z } from "zod";

import type { Locale } from "./config";
import { en, type MessageKey } from "./messages/en";
import { id } from "./messages/id";
import { interpolate, type MessageParams } from "./ui";
import { VALIDATION_MESSAGE_PREFIX } from "./validation-message";

export type { MessageKey } from "./messages/en";
export type { MessageParams } from "./ui";

const catalogs: Record<Locale, Record<MessageKey, string>> = { en, id };

export function translate(locale: Locale, key: MessageKey, params?: MessageParams): string {
  return interpolate(catalogs[locale][key], params);
}

const zodLocales = { en: z.locales.en, id: z.locales.id } satisfies Record<Locale, () => { localeError: unknown }>;
const zodErrorMaps = new Map<Locale, z.core.$ZodErrorMap>();

/** Error map zod per locale, dipakai per-parse (bukan global) supaya aman untuk request paralel. */
export function zodErrorMap(locale: Locale): z.core.$ZodErrorMap {
  let map = zodErrorMaps.get(locale);
  if (!map) {
    map = zodLocales[locale]().localeError;
    zodErrorMaps.set(locale, map);
  }
  return map;
}

const isMessageKey = (value: string): value is MessageKey => Object.hasOwn(en, value);

/**
 * Pesan satu issue zod dalam locale request. Pesan bawaan zod sudah diterjemahkan oleh `zodErrorMap`;
 * pesan kustom schema (`localized("validation.…")`) berupa penanda kunci dan diterjemahkan di sini.
 */
export function localizeIssue(locale: Locale, issue: z.core.$ZodIssue): string {
  const { message } = issue;
  if (message.startsWith(VALIDATION_MESSAGE_PREFIX)) {
    const key = message.slice(VALIDATION_MESSAGE_PREFIX.length);
    return isMessageKey(key) ? translate(locale, key) : message;
  }

  // Error map locale mengharapkan bentuk "mentah" (issue sebelum difinalisasi zod, field `input` wajib);
  // issue yang sudah jadi (dari `error.issues`) membawa data yang sama saat runtime, jadi aman di-cast.
  const localizedMessage = zodErrorMap(locale)(issue as unknown as z.core.$ZodRawIssue);
  return typeof localizedMessage === "string" ? localizedMessage : (localizedMessage?.message ?? message);
}

/**
 * Error validasi untuk respons API: pesan per field, ditambah `_form` untuk error yang tidak terikat
 * field (mis. field tak dikenal pada schema `.strict()`). Semua pesan dalam locale request.
 */
export function validationErrors(error: z.ZodError, locale: Locale): Record<string, string[]> {
  const errors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const field = issue.path.length ? issue.path.join(".") : "_form";
    errors[field] ??= [];
    errors[field].push(localizeIssue(locale, issue));
  }
  return errors;
}
