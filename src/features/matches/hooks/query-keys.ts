import type { ListMatchesRequest } from "../types";

export const matchesKeys = {
  all: () => ["matches"] as const,
  list: (request: ListMatchesRequest) => ["matches", "list", request] as const,
};
