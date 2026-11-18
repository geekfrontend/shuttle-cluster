"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { getClustering } from "../api/clustering.api";
import type { ClusteringRequest, ClusteringResult } from "../types";
import { clusteringKeys } from "./query-keys";

/**
 * Hasil clustering untuk filter `request`. Hasil sebelumnya tetap tampil selama filter baru dihitung.
 * `initialData` (dari Server Component) dipakai untuk filter awal supaya halaman tidak menghitung dua kali.
 */
export function useClustering(request: ClusteringRequest, initialData?: ClusteringResult) {
  return useQuery({
    queryKey: clusteringKeys.run(request),
    queryFn: () => getClustering(request),
    placeholderData: keepPreviousData,
    initialData,
    // Data pertandingan jarang berubah; hasil clustering untuk filter yang sama bisa dipakai ulang.
    staleTime: 5 * 60_000,
  });
}
