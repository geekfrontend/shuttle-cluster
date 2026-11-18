import { apiData, apiFetch, withQuery } from "@/lib/api-client";

import type { CreateMatchRequest, ListMatchesRequest, ListMatchesResponse, Match, MutationResult } from "../types";

const BASE = "/api/matches";

export function listMatches(request: ListMatchesRequest): Promise<ListMatchesResponse> {
  return apiData(withQuery(BASE, request));
}

export async function createMatch(request: CreateMatchRequest): Promise<MutationResult<Match>> {
  const { data, message } = await apiFetch<Match>(BASE, { method: "POST", body: request });
  if (!data) throw new Error("Empty response");
  return { data, message };
}

export async function deleteMatch(matchId: string): Promise<{ message: string }> {
  const { message } = await apiFetch(`${BASE}/${matchId}`, { method: "DELETE" });
  return { message };
}
