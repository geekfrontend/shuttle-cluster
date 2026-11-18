"use client";

import { useState } from "react";

import type { ColumnFiltersState, ColumnVisibilityState, PaginationState, Updater } from "@tanstack/react-table";

import { useDebouncedValue } from "@/hooks/use-debounced-value";

function resolve<T>(updater: Updater<T>, current: T): T {
  return typeof updater === "function" ? (updater as (old: T) => T)(current) : updater;
}

/**
 * State tabel untuk data yang dipaginasi dan difilter di server. Pencarian dan filter
 * mengembalikan ke halaman pertama. `filterOf(id)` membaca nilai filter kolom (`string[]`).
 */
export function useServerTableState({
  pageSize = 10,
  columnVisibility: initialVisibility = {},
}: {
  pageSize?: number;
  columnVisibility?: ColumnVisibilityState;
} = {}) {
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize });
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibilityState>(initialVisibility);
  const [search, setSearchValue] = useState("");
  const debouncedSearch = useDebouncedValue(search.trim());

  const toFirstPage = () => setPagination((current) => ({ ...current, pageIndex: 0 }));

  return {
    pagination,
    columnFilters,
    columnVisibility,
    search,
    /** Nilai pencarian yang sudah di-debounce, siap dikirim ke API. */
    query: debouncedSearch || undefined,
    /** User sudah mengetik tapi pencarian belum dikirim (masih di-debounce) — tampilkan sebagai sedang memuat. */
    searchPending: search.trim() !== debouncedSearch,
    setSearch: (value: string) => {
      setSearchValue(value);
      toFirstPage();
    },
    onPaginationChange: (updater: Updater<PaginationState>) =>
      setPagination((current) => {
        const next = resolve(updater, current);
        return next.pageSize === current.pageSize ? next : { ...next, pageIndex: 0 };
      }),
    onColumnFiltersChange: (updater: Updater<ColumnFiltersState>) => {
      setColumnFilters((current) => resolve(updater, current));
      toFirstPage();
    },
    onColumnVisibilityChange: (updater: Updater<ColumnVisibilityState>) =>
      setColumnVisibility((current) => resolve(updater, current)),
    filterOf: (id: string) => columnFilters.find((filter) => filter.id === id)?.value as string[] | undefined,
    /** Parameter halaman untuk API (1-based). */
    page: { page: pagination.pageIndex + 1, pageSize: pagination.pageSize },
  };
}
