"use client";

import { useQueries } from "@tanstack/react-query";

import type { CategoryCode } from "@/lib/badminton/categories";

import { getClustering } from "../api/clustering.api";
import { DEFAULT_CLUSTERING_FILTERS } from "../types";
import { clusteringKeys } from "./query-keys";

/**
 * Hasil clustering filter default untuk beberapa kategori sekaligus (mis. ringkasan di dasbor). Kunci query sama
 * dengan halaman kategori, jadi hasilnya dipakai ulang saat halaman itu dibuka.
 */
export function useClusteringOverview(categories: readonly CategoryCode[]) {
  return useQueries({
    queries: categories.map((category) => {
      const request = { category, ...DEFAULT_CLUSTERING_FILTERS };
      return {
        queryKey: clusteringKeys.run(request),
        queryFn: () => getClustering(request),
        staleTime: 5 * 60_000,
      };
    }),
  });
}
