"use client";

import { createContext, type ReactNode, useContext } from "react";

import { DEFAULT_LOCALE, type Locale } from "./config";
import type { MessageCatalog } from "./ui";

const LocaleContext = createContext<Locale>(DEFAULT_LOCALE);

/** Disediakan di root layout dengan locale hasil `getLocale()` di server. */
export function LocaleProvider({ locale, children }: { readonly locale: Locale; readonly children: ReactNode }) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

export function useLocale(): Locale {
  return useContext(LocaleContext);
}

/** Pesan UI sebuah fitur untuk locale aktif (Client Component). */
export function useMessages<T>(catalog: MessageCatalog<T>): T {
  return catalog[useLocale()];
}
