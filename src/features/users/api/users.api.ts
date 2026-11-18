import { apiData, apiFetch, withQuery } from "@/lib/api-client";

import type {
  CreateUserRequest,
  ListUsersRequest,
  ListUsersResponse,
  MutationResult,
  ResetPasswordRequest,
  UpdateUserRequest,
  User,
} from "../types";

const BASE = "/api/users";

export function listUsers(request: ListUsersRequest): Promise<ListUsersResponse> {
  return apiData(withQuery(BASE, request));
}

export async function createUser(request: CreateUserRequest): Promise<MutationResult<User>> {
  const { data, message } = await apiFetch<User>(BASE, { method: "POST", body: request });
  if (!data) throw new Error("Empty response");
  return { data, message };
}

export async function updateUser(userId: string, request: UpdateUserRequest): Promise<MutationResult<User>> {
  const { data, message } = await apiFetch<User>(`${BASE}/${userId}`, { method: "PATCH", body: request });
  if (!data) throw new Error("Empty response");
  return { data, message };
}

export async function resetUserPassword(userId: string, request: ResetPasswordRequest): Promise<{ message: string }> {
  const { message } = await apiFetch(`${BASE}/${userId}/reset-password`, { method: "POST", body: request });
  return { message };
}
