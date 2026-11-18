import { apiFetch } from "@/lib/api-client";

import type { UpdateLocaleRequest } from "../types";

/** Simpan bahasa pilihan ke profil user (`users.locale`). */
export async function updateLocale(request: UpdateLocaleRequest): Promise<void> {
  await apiFetch("/api/me", { method: "PATCH", body: request });
}
