"use client";

import type { ReactNode } from "react";

import type { ReactTable, RowData } from "@tanstack/react-table";
import { cn } from "cn";
import { Settings2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { workspaceMessages } from "@/features/workspace/messages";
import type { DataTableFeatures } from "@/lib/data-table-features";
import { useMessages } from "@/lib/i18n/locale-provider";

/**
 * Toolbar bergaya Tasks: pencarian, filter, tombol Reset, dan menu View (tampil/sembunyikan kolom).
 * Pencarian (opsional) dikelola pemanggil karena dikirim ke API (bukan filter kolom lokal).
 */
export function DataTableToolbar<TData extends RowData>({
  table,
  search,
  onSearchChange,
  searchPlaceholder,
  columnLabels,
  children,
}: {
  readonly table: ReactTable<DataTableFeatures, TData>;
  readonly search?: string;
  readonly onSearchChange?: (value: string) => void;
  readonly searchPlaceholder?: string;
  /** Label kolom untuk menu View, per `column.id`. Kolom tanpa label tidak bisa disembunyikan. */
  readonly columnLabels: Partial<Record<string, string>>;
  readonly children?: ReactNode;
}) {
  const m = useMessages(workspaceMessages).table;
  const isFiltered = table.state.columnFilters.length > 0 || Boolean(search);
  const hideableColumns = table.getAllColumns().filter((column) => column.getCanHide() && columnLabels[column.id]);
  // Baca dari `table.state`, bukan `column.getIsVisible()`: objek `Column` stabil, jadi React Compiler meng-cache hasilnya.
  const isVisible = (id: string) => table.state.columnVisibility[id] !== false;
  const hiddenCount = hideableColumns.filter((column) => !isVisible(column.id)).length;

  return (
    <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-1 flex-wrap items-center gap-1.5">
        {onSearchChange && (
          <Input
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            className="h-7 w-full bg-background text-foreground placeholder:text-muted-foreground sm:w-64"
          />
        )}
        {children}
        {isFiltered && (
          <Button
            variant="destructive"
            size="icon-sm"
            aria-label={m.reset}
            title={m.reset}
            onClick={() => {
              table.resetColumnFilters();
              onSearchChange?.("");
            }}
          >
            <X />
          </Button>
        )}
      </div>
      {hideableColumns.length > 0 && (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn("ml-auto hidden lg:flex", hiddenCount > 0 && "bg-muted text-foreground")}
              >
                <Settings2 data-icon="inline-start" />
                {m.view}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuLabel>{m.toggleColumns}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                {hideableColumns.map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    checked={isVisible(column.id)}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    onSelect={(event) => event.preventDefault()}
                  >
                    {columnLabels[column.id]}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
}
