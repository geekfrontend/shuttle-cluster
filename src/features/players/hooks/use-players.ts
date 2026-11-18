"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { listPlayers } from "../api/players.api";
import type { ListPlayersRequest } from "../types";
import { playersKeys } from "./query-keys";

export function usePlayers(request: ListPlayersRequest, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: playersKeys.list(request),
    queryFn: () => listPlayers(request),
    placeholderData: keepPreviousData,
    enabled: options.enabled,
  });
}
