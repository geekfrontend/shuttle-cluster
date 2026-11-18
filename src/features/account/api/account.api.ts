import { apiFetch } from "@/lib/api-client";

import type { UpdateProfileRequest } from "../types";

export async function updateProfile(request: UpdateProfileRequest): Promise<{ message: string }> {
  const { message } = await apiFetch("/api/me", { method: "PATCH", body: request });
  return { message };
}
