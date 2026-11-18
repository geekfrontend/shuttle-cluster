"use client";

import type { MouseEvent } from "react";

import type { ReactTable, RowData } from "@tanstack/react-table";
import { cn } from "cn";
import { ChevronsLeft, ChevronsRight } from "lucide-react";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { workspaceMessages } from "@/features/workspace/messages";
import { useFormatters } from "@/hooks/use-formatters";
import type { DataTableFeatures } from "@/lib/data-table-features";
import { useMessages } from "@/lib/i18n/locale-provider";
import { interpolate } from "@/lib/i18n/ui";

const PAGE_SIZES = [10, 20, 30, 40, 50];

function preventNavigation(event: MouseEvent<HTMLAnchorElement>) {
  event.preventDefault();
}

function getPageNumbers(currentPage: number, pageCount: number) {
  if (pageCount <= 3) return Array.from({ length: pageCount }, (_, index) => index + 1);
  if (currentPage <= 2) return [1, 2, 3];
  if (currentPage >= pageCount - 1) return [pageCount - 2, pageCount - 1, pageCount];
  return [currentPage - 1, currentPage, currentPage + 1];
}

export function DataTablePagination<TData extends RowData>({
  table,
}: {
  readonly table: ReactTable<DataTableFeatures, TData>;
}) {
  const m = useMessages(workspaceMessages).table;
  const format = useFormatters();
  const pageIndex = table.state.pagination.pageIndex;
  const pageCount = Math.max(table.getPageCount(), 1);
  const currentPage = Math.min(pageIndex + 1, pageCount);
  const pageNumbers = getPageNumbers(currentPage, pageCount);
  const canPrevious = table.getCanPreviousPage();
  const canNext = table.getCanNextPage();

  return (
    <div className="flex flex-col gap-2 border-t px-3 py-2 md:flex-row md:items-center md:justify-between">
      <div className="text-muted-foreground text-sm tabular-nums">
        {interpolate(m.rows, { total: format.number(table.getRowCount()) })}
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-4 lg:gap-5">
        <div className="flex items-center gap-2">
          <p className="font-medium text-muted-foreground text-sm">{m.rowsPerPage}</p>
          <Select
            value={`${table.state.pagination.pageSize}`}
            onValueChange={(value) => table.setPageSize(Number(value))}
          >
            <SelectTrigger size="sm" className="w-18" aria-label={m.rowsPerPage}>
              <SelectValue placeholder={table.state.pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              <SelectGroup>
                {PAGE_SIZES.map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-start whitespace-nowrap font-medium text-sm tabular-nums sm:justify-center">
          {interpolate(m.pageOf, { page: format.number(currentPage), totalPages: format.number(pageCount) })}
        </div>
        <Pagination className="mx-0 w-auto justify-start sm:justify-end">
          <PaginationContent className="gap-0.5 *:data-[slot=pagination-item]:*:h-7">
            <PaginationItem className="hidden lg:block">
              <PaginationLink
                href="#"
                aria-label={m.firstPage}
                aria-disabled={!canPrevious}
                className={cn(!canPrevious && "pointer-events-none opacity-50")}
                onClick={(event) => {
                  preventNavigation(event);
                  if (canPrevious) table.setPageIndex(0);
                }}
              >
                <ChevronsLeft />
              </PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                text={m.previous}
                aria-label={m.previousPage}
                aria-disabled={!canPrevious}
                className={cn(!canPrevious && "pointer-events-none opacity-50")}
                onClick={(event) => {
                  preventNavigation(event);
                  if (canPrevious) table.previousPage();
                }}
              />
            </PaginationItem>
            {pageNumbers[0] > 1 && (
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            )}
            {pageNumbers.map((pageNumber) => (
              <PaginationItem key={pageNumber}>
                {/* Lebar mengikuti isi (bukan kotak ikon tetap) supaya nomor halaman panjang, mis. 10.418, tidak bertumpuk. */}
                <PaginationLink
                  href="#"
                  size="sm"
                  isActive={pageIndex === pageNumber - 1}
                  className="min-w-7 justify-center px-1.5"
                  onClick={(event) => {
                    preventNavigation(event);
                    table.setPageIndex(pageNumber - 1);
                  }}
                >
                  {format.number(pageNumber)}
                </PaginationLink>
              </PaginationItem>
            ))}
            {pageNumbers[pageNumbers.length - 1] < pageCount && (
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            )}
            <PaginationItem>
              <PaginationNext
                href="#"
                text={m.next}
                aria-label={m.nextPage}
                aria-disabled={!canNext}
                className={cn(!canNext && "pointer-events-none opacity-50")}
                onClick={(event) => {
                  preventNavigation(event);
                  if (canNext) table.nextPage();
                }}
              />
            </PaginationItem>
            <PaginationItem className="hidden lg:block">
              <PaginationLink
                href="#"
                aria-label={m.lastPage}
                aria-disabled={!canNext}
                className={cn(!canNext && "pointer-events-none opacity-50")}
                onClick={(event) => {
                  preventNavigation(event);
                  if (canNext) table.setPageIndex(pageCount - 1);
                }}
              >
                <ChevronsRight />
              </PaginationLink>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}
