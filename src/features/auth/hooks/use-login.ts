"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { login } from "../api/auth.api";

/** Login. Cache query milik user sebelumnya dibuang saat berhasil. */
export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: login,
    onSuccess: () => queryClient.clear(),
  });
}
