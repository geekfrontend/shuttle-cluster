"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { playersKeys } from "@/features/players/hooks/query-keys";

import { createMatch, deleteMatch } from "../api/matches.api";
import type { CreateMatchRequest } from "../types";
import { matchesKeys } from "./query-keys";

/** Jumlah pertandingan tampil di daftar pemain, jadi daftar pemain ikut di-invalidate. */
function useInvalidate() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: matchesKeys.all() }),
      queryClient.invalidateQueries({ queryKey: playersKeys.all() }),
    ]);
}

export function useCreateMatch() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (request: CreateMatchRequest) => createMatch(request),
    onSuccess: invalidate,
  });
}

export function useDeleteMatch() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (matchId: string) => deleteMatch(matchId),
    onSuccess: invalidate,
  });
}
