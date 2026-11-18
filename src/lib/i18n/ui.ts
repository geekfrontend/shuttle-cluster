import type { Locale } from "./config";

/**
 * Katalog pesan UI satu fitur: satu objek per locale dengan bentuk yang sama.
 * Bentuknya diambil dari locale `en`; locale lain wajib `satisfies` tipe yang sama agar tidak ada kunci yang hilang.
 */
export type MessageCatalog<T> = Record<Locale, T>;

export type MessageParams = Record<string, string | number>;

/** Ganti placeholder `{name}` dengan nilai dari `params`. Dipakai pesan API maupun pesan UI. */
export function interpolate(template: string, params?: MessageParams): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) => (name in params ? String(params[name]) : match));
}
