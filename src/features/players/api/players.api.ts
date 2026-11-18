import { apiData, apiFetch, withQuery } from "@/lib/api-client";

import type {
  CreatePlayerRequest,
  ListPlayersRequest,
  ListPlayersResponse,
  MutationResult,
  Player,
  UpdatePlayerRequest,
} from "../types";

const BASE = "/api/players";

export function listPlayers(request: ListPlayersRequest): Promise<ListPlayersResponse> {
  return apiData(withQuery(BASE, request));
}

export async function createPlayer(request: CreatePlayerRequest): Promise<MutationResult<Player>> {
  const { data, message } = await apiFetch<Player>(BASE, { method: "POST", body: request });
  if (!data) throw new Error("Empty response");
  return { data, message };
}

export async function updatePlayer(playerId: string, request: UpdatePlayerRequest): Promise<MutationResult<Player>> {
  const { data, message } = await apiFetch<Player>(`${BASE}/${playerId}`, { method: "PATCH", body: request });
  if (!data) throw new Error("Empty response");
  return { data, message };
}

export async function deletePlayer(playerId: string): Promise<{ message: string }> {
  const { message } = await apiFetch(`${BASE}/${playerId}`, { method: "DELETE" });
  return { message };
}
