"use client";

import { useMutation } from "@tanstack/react-query";

import { updateLocale } from "../api/workspace.api";

export function useUpdateLocale() {
  return useMutation({ mutationFn: updateLocale });
}
