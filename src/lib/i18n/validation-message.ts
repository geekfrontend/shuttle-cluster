import type { MessageKey } from "./messages/en";

/*
 * Pesan validasi kustom di schema zod (`src/validations`). Schema dibuat sekali di level modul, sedangkan
 * locale baru diketahui per request — jadi schema hanya menyimpan penanda kunci pesan, dan penanda itu
 * diterjemahkan saat hasil parse diformat (`localizeIssue` di `./translate`).
 *
 * Modul ini sengaja tidak mengimpor katalog pesan supaya schema tetap ringan bila diimpor dari halaman.
 */

export const VALIDATION_MESSAGE_PREFIX = "i18n:";

/** Kunci pesan yang boleh dipakai sebagai pesan validasi kustom. */
export type ValidationMessageKey = Extract<MessageKey, `validation.${string}`>;

/** Parameter `error` zod dengan pesan ber-locale, mis. `.regex(pattern, localized("validation.nik"))`. */
export const localized = (key: ValidationMessageKey) => ({ error: `${VALIDATION_MESSAGE_PREFIX}${key}` });
