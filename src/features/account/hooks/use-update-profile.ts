"use client";

import { useMutation } from "@tanstack/react-query";

import { updateProfile } from "../api/account.api";

export function useUpdateProfile() {
  return useMutation({ mutationFn: updateProfile });
}
