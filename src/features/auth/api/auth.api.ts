import { apiFetch } from "@/lib/api-client";

import type { LoginRequest, LoginResponse } from "../types";

// Fungsi transport murni untuk endpoint auth. Dipakai oleh hook React Query di ../hooks.

export async function login(request: LoginRequest): Promise<LoginResponse> {
  const { data } = await apiFetch<LoginResponse>("/api/auth/login", { method: "POST", body: request });
  if (!data) throw new Error("Empty login response");
  return data;
}

export async function logout(): Promise<void> {
  await apiFetch("/api/auth/logout", { method: "POST" });
}
