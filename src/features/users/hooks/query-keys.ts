import type { ListUsersRequest } from "../types";

export const usersKeys = {
  all: () => ["users"] as const,
  list: (request: ListUsersRequest) => ["users", "list", request] as const,
};
