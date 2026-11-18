"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { listUsers } from "../api/users.api";
import type { ListUsersRequest } from "../types";
import { usersKeys } from "./query-keys";

export function useUsers(request: ListUsersRequest) {
  return useQuery({
    queryKey: usersKeys.list(request),
    queryFn: () => listUsers(request),
    placeholderData: keepPreviousData,
  });
}
