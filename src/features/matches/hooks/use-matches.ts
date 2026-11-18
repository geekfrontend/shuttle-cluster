"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { listMatches } from "../api/matches.api";
import type { ListMatchesRequest } from "../types";
import { matchesKeys } from "./query-keys";

export function useMatches(request: ListMatchesRequest) {
  return useQuery({
    queryKey: matchesKeys.list(request),
    queryFn: () => listMatches(request),
    placeholderData: keepPreviousData,
  });
}
