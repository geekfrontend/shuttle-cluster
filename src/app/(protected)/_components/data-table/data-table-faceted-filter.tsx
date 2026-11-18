"use client";

import type { ReactTable, RowData } from "@tanstack/react-table";
import { cn } from "cn";
import { Check, ListFilter, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { workspaceMessages } from "@/features/workspace/messages";
import type { DataTableFeatures } from "@/lib/data-table-features";
import { useMessages } from "@/lib/i18n/locale-provider";
import { interpolate } from "@/lib/i18n/ui";

export type FacetOption = { value: string; label: string };

/** Label terpilih yang masih muat di tombol; lebih dari ini diringkas jadi "N dipilih". */
const MAX_INLINE_LABELS = 2;

/** Indikator saja (bukan kontrol): item menu sudah interaktif, kontrol bersarang merusak aksesibilitas. */
function CheckboxMark({ checked }: { readonly checked: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-4 shrink-0 items-center justify-center border border-input dark:bg-input/30",
        checked && "border-primary bg-primary text-primary-foreground dark:bg-primary",
      )}
    >
      {checked && <Check className="size-3 text-primary-foreground!" />}
    </span>
  );
}

function RadioMark({ checked }: { readonly checked: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-4 shrink-0 items-center justify-center rounded-full border border-input dark:bg-input/30",
        checked && "border-primary bg-primary dark:bg-primary",
      )}
    >
      {checked && <span className="size-1.5 rounded-full bg-primary-foreground" />}
    </span>
  );
}

// Indikator ceklis bawaan item (di kanan) disembunyikan; tanda pilihan digambar di kiri.
const ITEM_CLASS =
  "pr-2 data-[state=checked]:font-medium *:data-[slot=dropdown-menu-checkbox-item-indicator]:hidden *:data-[slot=dropdown-menu-radio-item-indicator]:hidden";

/**
 * Filter kolom bergaya Tasks (tombol dashed). Nilai filter kolom berupa `string[]`.
 * - default (multi): kotak centang, boleh beberapa nilai — menu tetap terbuka saat memilih.
 * - `single`: tombol radio, satu nilai — untuk filter yang maknanya tunggal (mis. tingkat risiko yang tumpang
 *   tindih). Menu tertutup setelah memilih; memilih nilai yang sama lagi menghapusnya.
 *
 * Menerima `table` (bukan `Column`) dan membaca `table.state`: objek `Column` stabil, sehingga React
 * Compiler meng-cache semua turunannya (termasuk `getFilterValue()`) dan nilai terpilih tidak pernah ikut berubah.
 */
export function DataTableFacetedFilter<TData extends RowData>({
  table,
  columnId,
  title,
  options,
  single = false,
}: {
  readonly table: ReactTable<DataTableFeatures, TData>;
  readonly columnId: string;
  readonly title: string;
  readonly options: FacetOption[];
  readonly single?: boolean;
}) {
  const m = useMessages(workspaceMessages).table;
  const column = table.getColumn(columnId);
  if (!column) return null;
  const target = column;

  const value = table.state.columnFilters.find((filter) => filter.id === columnId)?.value;
  const selected = new Set((value as string[] | undefined) ?? []);
  const selectedLabels = options.filter((option) => selected.has(option.value)).map((option) => option.label);

  const apply = (next: Set<string>) => target.setFilterValue(next.size ? [...next] : undefined);

  function toggle(option: string) {
    const next = new Set(selected);
    if (next.has(option)) next.delete(option);
    else next.add(option);
    apply(next);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn("border-dashed", selected.size > 0 && "border-solid bg-muted text-foreground")}
        >
          <ListFilter data-icon="inline-start" />
          {title}
          {selectedLabels.length > 0 && (
            <>
              <Separator orientation="vertical" className="mx-0.5 h-3.5" />
              {selectedLabels.length > MAX_INLINE_LABELS ? (
                <Badge variant="secondary" className="px-1 font-normal">
                  {interpolate(m.selectedCount, { count: selectedLabels.length })}
                </Badge>
              ) : (
                selectedLabels.map((label) => (
                  <Badge key={label} variant="secondary" className="px-1 font-normal">
                    {label}
                  </Badge>
                ))
              )}
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52">
        <DropdownMenuLabel>{single ? m.singleHint : m.multiHint}</DropdownMenuLabel>
        {single ? (
          <DropdownMenuRadioGroup value={[...selected][0] ?? ""}>
            {options.map((option) => (
              <DropdownMenuRadioItem
                key={option.value}
                value={option.value}
                className={ITEM_CLASS}
                onSelect={() => apply(new Set(selected.has(option.value) ? [] : [option.value]))}
              >
                <RadioMark checked={selected.has(option.value)} />
                {option.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        ) : (
          <DropdownMenuGroup>
            {options.map((option) => (
              <DropdownMenuCheckboxItem
                key={option.value}
                checked={selected.has(option.value)}
                className={ITEM_CLASS}
                onCheckedChange={() => toggle(option.value)}
                onSelect={(event) => event.preventDefault()}
              >
                <CheckboxMark checked={selected.has(option.value)} />
                {option.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuGroup>
        )}
        {selected.size > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem variant="destructive" onSelect={() => apply(new Set())}>
                <X />
                {m.clearFilters}
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
