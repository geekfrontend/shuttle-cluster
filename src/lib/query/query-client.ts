import { isServer, QueryClient } from "@tanstack/react-query";

import { ApiClientError } from "@/lib/api-client";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Hindari refetch langsung setelah hidrasi/SSR.
        staleTime: 60_000,
        // Error 4xx (validasi, auth, permission) tidak akan berubah dengan retry.
        retry: (failureCount, error) =>
          !(error instanceof ApiClientError && error.statusCode >= 400 && error.statusCode < 500) && failureCount < 2,
      },
      mutations: { retry: false },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

/** Server: client baru per request. Browser: satu client dipakai ulang (jangan dibuat ulang saat suspend). */
export function getQueryClient() {
  if (isServer) return makeQueryClient();
  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
}
