import type { ListPlayersRequest } from "../types";

export const playersKeys = {
  all: () => ["players"] as const,
  list: (request: ListPlayersRequest) => ["players", "list", request] as const,
};
