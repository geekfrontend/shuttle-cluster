"use client";

import type { ReactNode } from "react";

import type { ReactTable, RowData } from "@tanstack/react-table";
import { CircleAlert, type LucideIcon, SearchX, X } from "lucide-react";

import { EmptyStateMarquee } from "@/components/shared/empty-state-marquee";
import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { workspaceMessages } from "@/features/workspace/messages";
import type { DataTableFeatures } from "@/lib/data-table-features";
import { useMessages } from "@/lib/i18n/locale-provider";

import { DataTablePagination } from "./data-table-pagination";

/** Empty state saat tabel belum punya data sama sekali. `icon` mewakili isi tabel (mis. `Package`). */
export type DataTableEmpty = {
  icon: LucideIcon;
  title: string;
  description?: string;
  /** Ajakan membuat record pertama (opsional). */
  action?: ReactNode;
};

/** Bentuk placeholder per kolom saat loading, supaya lebar kolom tidak bergeser ketika data tiba. */
function SkeletonCell({ columnId }: { readonly columnId: string }) {
  if (columnId === "actions") {
    return (
      <div className="flex justify-end">
        <Skeleton className="size-6" />
      </div>
    );
  }
  if (columnId === "select") return <Skeleton className="size-4" />;
  return <Skeleton className="h-4 w-full max-w-36" />;
}

/**
 * Tabel data mengikuti pola halaman Tasks (container border, toolbar, header, footer pagination).
 *
 * Tabel kosong punya dua keadaan yang berbeda: belum ada data (`empty`, ajakan membuat record pertama)
 * dan tidak ada yang cocok dengan pencarian/filter (dengan tombol hapus filter). Pencarian dikelola
 * pemanggil, jadi kirim `search` & `onSearchChange` yang sama dengan `DataTableToolbar`.
 *
 * `loading` = muat pertama (baris skeleton). `fetching` = memuat ulang karena cari/filter/halaman berubah:
 * data lama tetap tampil di bawah overlay dengan spinner, supaya user tahu aplikasi sedang mengambil data.
 */
export function DataTable<TData extends RowData>({
  table,
  toolbar,
  loading,
  fetching = false,
  error,
  onRetry,
  empty,
  search,
  onSearchChange,
}: {
  readonly table: ReactTable<DataTableFeatures, TData>;
  readonly toolbar?: ReactNode;
  readonly loading: boolean;
  /** Memuat ulang di latar (mis. `query.isFetching`); diabaikan saat `loading`. */
  readonly fetching?: boolean;
  readonly error?: string | null;
  readonly onRetry?: () => void;
  readonly empty?: DataTableEmpty;
  readonly search?: string;
  readonly onSearchChange?: (value: string) => void;
}) {
  const m = useMessages(workspaceMessages);
  const columns = table.getVisibleLeafColumns();
  const rows = table.getRowModel().rows;
  const isFiltered = table.state.columnFilters.length > 0 || Boolean(search?.trim());

  function renderState(state: ReactNode) {
    return (
      <TableRow className="hover:bg-transparent">
        <TableCell colSpan={columns.length} className="whitespace-normal p-0">
          {state}
        </TableCell>
      </TableRow>
    );
  }

  function renderBody() {
    if (loading) {
      return Array.from({ length: Math.min(table.state.pagination.pageSize, 5) }, (_, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: baris skeleton statis
        <TableRow key={index} className="border-border/60 hover:bg-transparent">
          {columns.map((column) => (
            <TableCell key={column.id} className="py-2.5 align-middle">
              <SkeletonCell columnId={column.id} />
            </TableCell>
          ))}
        </TableRow>
      ));
    }
    if (error) {
      return renderState(
        <Empty className="py-10">
          <EmptyHeader>
            <EmptyMedia variant="icon" className="bg-destructive/10 text-destructive">
              <CircleAlert />
            </EmptyMedia>
            <EmptyTitle>{m.common.loadFailed}</EmptyTitle>
            {error !== m.common.loadFailed && <EmptyDescription>{error}</EmptyDescription>}
          </EmptyHeader>
          {onRetry && (
            <EmptyContent>
              <Button variant="outline" size="sm" onClick={onRetry}>
                {m.common.retry}
              </Button>
            </EmptyContent>
          )}
        </Empty>,
      );
    }
    if (rows.length === 0) {
      if (isFiltered) {
        return renderState(
          <Empty className="py-8">
            <EmptyHeader className="max-w-md">
              <EmptyMedia className="w-full">
                <EmptyStateMarquee icon={SearchX} size="sm" />
              </EmptyMedia>
              <EmptyTitle>{m.table.filteredTitle}</EmptyTitle>
              <EmptyDescription>{m.table.filteredDescription}</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  table.resetColumnFilters();
                  onSearchChange?.("");
                }}
              >
                <X data-icon="inline-start" />
                {m.table.clearFilters}
              </Button>
            </EmptyContent>
          </Empty>,
        );
      }
      const description = empty ? empty.description : m.table.emptyDescription;
      return renderState(
        <Empty className="py-8">
          <EmptyHeader className="max-w-md">
            {empty && (
              <EmptyMedia className="w-full">
                <EmptyStateMarquee icon={empty.icon} size="sm" />
              </EmptyMedia>
            )}
            <EmptyTitle>{empty?.title ?? m.table.empty}</EmptyTitle>
            {description && <EmptyDescription>{description}</EmptyDescription>}
          </EmptyHeader>
          {empty?.action && <EmptyContent>{empty.action}</EmptyContent>}
        </Empty>,
      );
    }
    return rows.map((row) => (
      <TableRow key={row.id} className="border-border/60 hover:bg-muted/20">
        {row.getVisibleCells().map((cell) => (
          <TableCell key={cell.id} className="py-1.5 align-middle">
            <table.FlexRender cell={cell} />
          </TableCell>
        ))}
      </TableRow>
    ));
  }

  const refreshing = fetching && !loading;

  return (
    <div className="overflow-hidden rounded-none border border-border/70 bg-background">
      {toolbar && <div className="border-b px-3 py-2">{toolbar}</div>}
      <div className="relative" aria-busy={loading || refreshing}>
        {refreshing && (
          <div
            role="status"
            className="fade-in-0 absolute inset-0 z-10 flex animate-in items-center justify-center bg-background/60 backdrop-blur-[1px]"
          >
            {/* Cincin berputar dengan denyut di belakangnya; label hanya untuk pembaca layar. */}
            <span className="relative flex size-12 items-center justify-center" aria-hidden="true">
              <span className="absolute inset-0 animate-ping rounded-full bg-primary/15" />
              <span className="absolute inset-1 rounded-full bg-background shadow-md ring-1 ring-border" />
              <span className="relative size-7 animate-spin rounded-full border-[3px] border-primary/15 border-t-primary border-r-primary/60" />
            </span>
            <span className="sr-only">{m.table.fetching}</span>
          </div>
        )}
        <Table className="**:data-[slot=table-cell]:px-3 **:data-[slot=table-head]:px-3">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="h-8 font-medium text-muted-foreground" colSpan={header.colSpan}>
                    {header.isPlaceholder ? null : <table.FlexRender header={header} />}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>{renderBody()}</TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
    </div>
  );
}
