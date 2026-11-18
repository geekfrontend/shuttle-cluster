"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createPlayer, deletePlayer, updatePlayer } from "../api/players.api";
import type { CreatePlayerRequest, UpdatePlayerRequest } from "../types";
import { playersKeys } from "./query-keys";

function useInvalidate() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: playersKeys.all() });
}

export function useCreatePlayer() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (request: CreatePlayerRequest) => createPlayer(request),
    onSuccess: invalidate,
  });
}

export function useUpdatePlayer() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ playerId, ...request }: UpdatePlayerRequest & { playerId: string }) =>
      updatePlayer(playerId, request),
    onSuccess: invalidate,
  });
}

export function useDeletePlayer() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (playerId: string) => deletePlayer(playerId),
    onSuccess: invalidate,
  });
}
