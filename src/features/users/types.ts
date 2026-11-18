import type { Page } from "@/lib/pagination";

export type UserRole = "admin" | "user";
export type UserStatus = "active" | "locked" | "deactivated";

export type User = {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  role: UserRole;
  status: UserStatus;
  lastActiveAt: string | null;
  createdAt: string;
};

export type ListUsersRequest = {
  page: number;
  pageSize: number;
  q?: string;
  role?: UserRole[];
  status?: UserStatus[];
};
export type ListUsersResponse = Page<User>;

export type CreateUserRequest = { email: string; name: string; password: string; role: UserRole };

export type UpdateUserRequest = { name?: string; role?: UserRole; status?: "active" | "deactivated" };

export type ResetPasswordRequest = { password: string };

/** Hasil mutasi: data + pesan sukses dari server (sudah diterjemahkan). */
export type MutationResult<T> = { data: T; message: string };
