"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createUser, resetUserPassword, updateUser } from "../api/users.api";
import type { CreateUserRequest, ResetPasswordRequest, UpdateUserRequest } from "../types";
import { usersKeys } from "./query-keys";

function useInvalidate() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: usersKeys.all() });
}

export function useCreateUser() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (request: CreateUserRequest) => createUser(request),
    onSuccess: invalidate,
  });
}

export function useUpdateUser() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ userId, ...request }: UpdateUserRequest & { userId: string }) => updateUser(userId, request),
    onSuccess: invalidate,
  });
}

export function useResetUserPassword() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ userId, ...request }: ResetPasswordRequest & { userId: string }) =>
      resetUserPassword(userId, request),
    onSuccess: invalidate,
  });
}
