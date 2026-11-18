"use client";

import { useCallback, useMemo, useRef, useState } from "react";

import { type ColumnDef, type PaginationState, useTable } from "@tanstack/react-table";
import { cn } from "cn";
import {
  ArrowUpDown,
  CircleAlert,
  CircleCheck,
  Download,
  FileSpreadsheet,
  FileWarning,
  type LucideIcon,
  RotateCcw,
  Trash2,
  TriangleAlert,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/shared/badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useFormatters } from "@/hooks/use-formatters";
import { toCsvValue } from "@/lib/csv";
import { type DataTableFeatures, dataTableFeatures } from "@/lib/data-table-features";
import { interpolate } from "@/lib/i18n/ui";

import { DataTable } from "../data-table/data-table";
import { type CellMark, type Choice, EditableCell, SelectCell } from "./import-cells";

// ─── Tipe bersama (payload semua import berbentuk sama) ──────────────────────

export type ImportRowError<C extends string> = { column: C | null; message: string };
export type ImportRowInput<C extends string> = { line: number; values: Partial<Record<C, string>> };
export type ImportCheckedRow<C extends string> = ImportRowInput<C> & { errors: ImportRowError<C>[] };
export type ImportCheckSummary = { total: number; valid: number; invalid: number };
export type ImportCheckResult<C extends string, S extends ImportCheckSummary> = {
  rows: ImportCheckedRow<C>[];
  summary: S;
  columns: { unknown: string[]; missing: string[] };
};
export type ImportRowsPayload<C extends string> = { fileName: string; rows: ImportRowInput<C>[] };

/** Bagian `useMutation` yang dipakai layar review (hasil `{ data, message }` dari API client). */
type RowsMutation<C extends string, T> = {
  mutate: (
    request: ImportRowsPayload<C>,
    options?: {
      onSuccess?: (result: { data: T; message: string }) => void;
      onError?: (error: Error) => void;
    },
  ) => void;
  isPending: boolean;
  isError: boolean;
  error: Error | null;
};

/** Copy UI layar review; copy import tiap fitur memenuhi bentuk ini. */
export type ImportReviewLabels<C extends string> = {
  fields: Record<C, string>;
  columns: { line: string; result: string };
  rowError: string;
  filters: Record<RowFilter, string>;
  filterLabel: string;
  sort: Record<RowSort, string> & { label: string };
  searchPlaceholder: string;
  missingColumns: string;
  unknownColumns: string;
  fileRows: string;
  editHint: string;
  cellLabel: string;
  rechecking: string;
  errorCount: string;
  fixedCount: string;
  editedCount: string;
  downloadData: string;
  deleteRow: string;
  deleteRowTitle: string;
  deleteRowDescription: string;
  deleteInvalid: string;
  deleteInvalidTitle: string;
  deleteInvalidDescription: string;
  deleteConfirm: string;
  deleted: string;
  noRows: string;
  noRowsDescription: string;
  hasErrors: string;
  allValid: string;
  ok: string;
  change: string;
  committing: string;
};

/** Sel pilihan: daftar nilai tetap + pilihan yang cocok dengan isi sel saat ini. */
export type SelectConfig = { choices: Choice[]; selected: string | undefined; emptyLabel?: string };

export type SummaryTile = { label: string; value: string; tone?: "ok" | "error" };

type RowFilter = "all" | "valid" | "invalid";
type RowSort = "line" | "ready" | "invalid";
const ROW_SORTS: RowSort[] = ["line", "ready", "invalid"];
type Pending = { type: "row"; line: number } | { type: "invalid" } | null;

type ReviewRow<C extends string> = ImportRowInput<C> & {
  checked: ImportCheckedRow<C> | undefined;
  marks: Map<C, CellMark>;
};

const cellKey = (line: number, column: string) => `${line}:${column}`;

/** Sel yang punya error di hasil pemeriksaan ini. */
const errorCells = <C extends string>(rows: ImportCheckedRow<C>[]) =>
  rows.flatMap((row) => row.errors.flatMap((error) => (error.column ? [cellKey(row.line, error.column)] : [])));

/**
 * CSV dari data TERBARU (hasil edit & hapus) + kolom `errors`, urut baris asli. Bisa disimpan sebagai
 * cadangan atau diunggah lagi nanti — server mengabaikan kolom `errors`.
 */
function downloadCsv<C extends string>(
  columns: readonly C[],
  rows: ReviewRow<C>[],
  fileName: string,
  errorText: (error: ImportRowError<C>) => string,
) {
  const header = [...columns, "errors"];
  const body = rows.map((row) => [
    ...columns.map((column) => row.values[column] ?? ""),
    (row.checked?.errors ?? []).map(errorText).join("; "),
  ]);
  const csv = [header, ...body].map((cells) => cells.map(toCsvValue).join(",")).join("\r\n");
  // BOM supaya Excel membaca UTF-8 (nama dengan aksen, dsb.).
  const url = URL.createObjectURL(new Blob(["﻿", csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `${fileName.replace(/\.[^.]+$/, "")}-edited.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Tinjau hasil pemeriksaan import: setiap sel bisa diedit langsung, baris bisa dihapus (dengan konfirmasi),
 * dan data terbaru bisa diunduh. Setiap perubahan diperiksa ulang oleh server dengan aturan yang sama dengan
 * file; yang disimpan adalah data di layar ini, bukan file asli.
 */
export function ImportReview<C extends string, S extends ImportCheckSummary, R>({
  fileName,
  columns: importColumns,
  labels: m,
  cancelLabel,
  actionsLabel,
  emptyIcon,
  preview,
  emptySummary,
  recheck,
  commit,
  tiles,
  commitLabel,
  columnWidth,
  selectFor,
  placeholderFor,
  searchText,
  lineLabel = String,
  onBack,
  onDone,
}: {
  readonly fileName: string;
  readonly columns: readonly C[];
  readonly labels: ImportReviewLabels<C>;
  readonly cancelLabel: string;
  readonly actionsLabel: string;
  readonly emptyIcon: LucideIcon;
  readonly preview: ImportCheckResult<C, S>;
  /** Ringkasan saat semua baris dihapus (tanpa memanggil server). */
  readonly emptySummary: S;
  readonly recheck: RowsMutation<C, ImportCheckResult<C, S>>;
  readonly commit: RowsMutation<C, R>;
  readonly tiles: (summary: S) => SummaryTile[];
  readonly commitLabel: (summary: S) => string;
  readonly columnWidth: Record<C, string>;
  /** Kolom dengan nilai tetap → sel pilihan; `undefined` → sel teks. */
  readonly selectFor?: (column: C, value: string) => SelectConfig | undefined;
  /** Placeholder sel kosong (mis. nomor otomatis). */
  readonly placeholderFor?: (column: C, row: ImportCheckedRow<C> | undefined) => string | undefined;
  /** Teks yang dicari oleh kotak pencarian (selain nomor baris). */
  readonly searchText: (
    row: ImportRowInput<C>,
    checked: ImportCheckedRow<C> | undefined,
  ) => (string | null | undefined)[];
  /** Label nomor baris (mis. "MBR-000001 · 3" untuk file multi-sheet); default nomor baris apa adanya. */
  readonly lineLabel?: (line: number) => string;
  readonly onBack: () => void;
  readonly onDone: (result: R) => void;
}) {
  const format = useFormatters();

  const [records, setRecords] = useState<ImportRowInput<C>[]>(() =>
    [...preview.rows].sort((a, b) => a.line - b.line).map((row) => ({ line: row.line, values: row.values })),
  );
  const [checked, setChecked] = useState<ImportCheckResult<C, S>>(preview);
  const [edited, setEdited] = useState<Set<string>>(() => new Set());
  // Semua sel yang pernah error (sejak pemeriksaan pertama) — dasar tanda hijau "sudah diperbaiki".
  const [flagged, setFlagged] = useState<Set<string>>(() => new Set(errorCells(preview.rows)));
  const [pending, setPending] = useState<Pending>(null);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  // Selalu mulai di "Semua" supaya baris siap (hijau) dan baris error terlihat bersamaan.
  const [filter, setFilter] = useState<RowFilter>("all");
  // Baris yang baru diedit tetap tampil di tab aktif walau statusnya berubah (mis. sudah lolos di tab "Ada
  // error"), supaya tidak hilang di bawah kursor. Dilepas saat tab diganti.
  const [pinned, setPinned] = useState<Set<number>>(() => new Set());
  const [search, setSearch] = useState("");
  // Urut siap / tidak siap memakai status saat urutan dipilih (atau tab diganti), bukan status terbaru: baris
  // yang baru diperbaiki tidak melompat ke kelompok lain di bawah kursor.
  const [sort, setSort] = useState<RowSort>("line");
  const [sortStatus, setSortStatus] = useState<Map<number, boolean>>(() => new Map());

  // Jawaban pemeriksaan bisa datang tidak berurutan; hanya yang terakhir dipakai.
  const recordsRef = useRef(records);
  const requestId = useRef(0);
  const { mutate: runCheck } = recheck;

  const apply = useCallback(
    (next: ImportRowInput<C>[]) => {
      recordsRef.current = next;
      setRecords(next);
      const id = ++requestId.current;
      if (next.length === 0) {
        setChecked((current) => ({ ...current, rows: [], summary: emptySummary }));
        return;
      }
      runCheck(
        { fileName, rows: next },
        {
          onSuccess: ({ data }) => {
            if (id !== requestId.current) return;
            setChecked(data);
            setFlagged((current) => new Set([...current, ...errorCells(data.rows)]));
          },
          onError: (error) => toast.error(error.message),
        },
      );
    },
    [fileName, runCheck, emptySummary],
  );

  const editCell = useCallback(
    (line: number, column: C, value: string) => {
      setEdited((current) => new Set(current).add(cellKey(line, column)));
      setPinned((current) => new Set(current).add(line));
      apply(
        recordsRef.current.map((row) =>
          row.line === line ? { ...row, values: { ...row.values, [column]: value } } : row,
        ),
      );
    },
    [apply],
  );

  const checkedByLine = useMemo(() => new Map(checked.rows.map((row) => [row.line, row])), [checked.rows]);
  const summary = checked.summary;
  const checking = recheck.isPending;
  const ready = summary.invalid === 0 && summary.valid > 0 && !checking;
  const invalidLines = records
    .filter((row) => (checkedByLine.get(row.line)?.errors.length ?? 0) > 0)
    .map((row) => row.line);

  const errorNow = useMemo(() => new Set(errorCells(checked.rows)), [checked.rows]);
  const marksOf = useCallback(
    (line: number) => {
      const marks = new Map<C, CellMark>();
      const rowReady = checkedByLine.get(line)?.errors.length === 0;
      for (const column of importColumns) {
        const key = cellKey(line, column);
        if (errorNow.has(key)) continue;
        if (flagged.has(key)) marks.set(column, "fixed");
        else if (edited.has(key)) marks.set(column, "edited");
        else if (rowReady) marks.set(column, "ready");
      }
      return marks;
    },
    [importColumns, errorNow, flagged, edited, checkedByLine],
  );
  const fixedCount = [...flagged].filter(
    (key) => !errorNow.has(key) && records.some((row) => key.startsWith(`${row.line}:`)),
  ).length;

  const snapshotStatus = () =>
    new Map(records.map((row) => [row.line, checkedByLine.get(row.line)?.errors.length === 0]));

  const rows = useMemo<ReviewRow<C>[]>(() => {
    const q = search.trim().toLowerCase();
    const readyOf = (row: ReviewRow<C>) => sortStatus.get(row.line) ?? row.checked?.errors.length === 0;
    const filtered = records
      .map((row) => ({ ...row, checked: checkedByLine.get(row.line), marks: marksOf(row.line) }))
      .filter((row) => {
        const hasErrors = (row.checked?.errors.length ?? 0) > 0;
        const keep = pinned.has(row.line);
        if (filter === "valid" && hasErrors && !keep) return false;
        if (filter === "invalid" && !hasErrors && !keep) return false;
        if (!q) return true;
        return String(row.line) === q || searchText(row, row.checked).some((text) => text?.toLowerCase().includes(q));
      });
    if (sort === "line") return filtered;
    // `sort` stabil: di dalam tiap kelompok urutan baris file tetap terjaga.
    const first = sort === "ready";
    return filtered.sort((a, b) => Number(readyOf(b) === first) - Number(readyOf(a) === first));
  }, [records, checkedByLine, marksOf, filter, search, pinned, sort, sortStatus, searchText]);

  const columns = useMemo<ColumnDef<DataTableFeatures, ReviewRow<C>>[]>(
    () => [
      {
        id: "line",
        accessorFn: (row) => row.line,
        header: m.columns.line,
        cell: ({ row }) => {
          const result = row.original.checked;
          const rowReady = result?.errors.length === 0;
          return (
            <span className="flex items-center gap-1.5 font-mono text-muted-foreground text-xs">
              {result &&
                (rowReady ? (
                  <CircleCheck className="size-3.5 text-emerald-600 dark:text-emerald-400" aria-label={m.ok} />
                ) : (
                  <CircleAlert
                    className="size-3.5 text-destructive"
                    aria-label={interpolate(m.errorCount, { count: result.errors.length })}
                  />
                ))}
              {lineLabel(row.original.line)}
            </span>
          );
        },
      },
      ...importColumns.map<ColumnDef<DataTableFeatures, ReviewRow<C>>>((column) => ({
        id: column,
        accessorFn: (row) => row.values[column] ?? "",
        header: m.fields[column],
        cell: ({ row }) => {
          const { line, values, checked: result, marks } = row.original;
          const value = values[column] ?? "";
          const common = {
            value,
            label: interpolate(m.cellLabel, { column: m.fields[column], line: lineLabel(line) }),
            error: result?.errors.find((item) => item.column === column)?.message,
            mark: marks.get(column),
            className: columnWidth[column],
            onCommit: (next: string) => editCell(line, column, next),
          };
          const select = selectFor?.(column, value);
          if (select) return <SelectCell {...common} {...select} />;
          return (
            <EditableCell
              key={`${line}:${column}:${value}`}
              {...common}
              placeholder={value ? undefined : placeholderFor?.(column, result)}
            />
          );
        },
      })),
      {
        id: "result",
        accessorFn: (row) => row.checked?.errors.length ?? 0,
        header: m.columns.result,
        cell: ({ row }) => {
          const errors = row.original.checked?.errors ?? [];
          if (errors.length === 0) return <Badge tone="success">{m.ok}</Badge>;
          return (
            <ul className="grid w-64 gap-1 whitespace-normal text-xs">
              {errors.map((item) => (
                <li key={`${item.column}-${item.message}`} className="flex gap-1.5">
                  <CircleAlert className="mt-0.5 size-3 shrink-0 text-destructive" aria-hidden="true" />
                  <span>
                    <span className="font-medium text-destructive">
                      {item.column ? m.fields[item.column] : m.rowError}
                    </span>
                    <span className="text-muted-foreground"> · {item.message}</span>
                  </span>
                </li>
              ))}
            </ul>
          );
        },
      },
      {
        id: "actions",
        header: () => <span className="sr-only">{actionsLabel}</span>,
        cell: ({ row }) => (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground hover:text-destructive"
            aria-label={interpolate(m.deleteRow, { line: lineLabel(row.original.line) })}
            title={interpolate(m.deleteRow, { line: lineLabel(row.original.line) })}
            onClick={() => setPending({ type: "row", line: row.original.line })}
          >
            <Trash2 />
          </Button>
        ),
      },
    ],
    [m, actionsLabel, importColumns, columnWidth, editCell, selectFor, placeholderFor, lineLabel],
  );

  const table = useTable({
    features: dataTableFeatures,
    data: rows,
    columns,
    state: { pagination },
    getRowId: (row) => String(row.line),
    autoResetPageIndex: false,
    onPaginationChange: setPagination,
  });

  const toFirstPage = () => setPagination((current) => ({ ...current, pageIndex: 0 }));

  function confirmDelete() {
    if (!pending) return;
    const drop = new Set(pending.type === "row" ? [pending.line] : invalidLines);
    apply(recordsRef.current.filter((row) => !drop.has(row.line)));
    toast.success(interpolate(m.deleted, { count: format.number(drop.size) }));
    setPending(null);
    toFirstPage();
  }

  const errorText = (error: ImportRowError<C>) =>
    `${error.column ? m.fields[error.column] : m.rowError}: ${error.message}`;
  const counts: Record<RowFilter, number> = { all: summary.total, valid: summary.valid, invalid: summary.invalid };
  const header = preview.columns;
  const columnList = (names: string[]) =>
    names.map((name) => (name in m.fields ? m.fields[name as C] : name)).join(", ");
  const allRows = records.map((row) => ({
    ...row,
    checked: checkedByLine.get(row.line),
    marks: new Map<C, CellMark>(),
  }));

  return (
    <div className="flex flex-col gap-4">
      {/* Aksi utama di atas: tabel bisa panjang, jadi tidak perlu menggulir ke bawah untuk mengimpor. */}
      <div className="flex flex-col gap-3 border bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="flex min-w-0 items-center gap-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center bg-primary/10 text-primary">
            <FileSpreadsheet className="size-4" aria-hidden="true" />
          </span>
          <span className="grid min-w-0 leading-tight">
            <span className="truncate font-medium text-sm">{fileName}</span>
            <span className="truncate text-muted-foreground text-xs">
              {interpolate(m.fileRows, { count: format.number(summary.total) })}
            </span>
          </span>
        </span>
        <div className="flex flex-wrap gap-2 sm:justify-end">
          <Button variant="outline" onClick={onBack} disabled={commit.isPending}>
            <RotateCcw data-icon="inline-start" />
            {m.change}
          </Button>
          <Button
            onClick={() =>
              commit.mutate(
                { fileName, rows: recordsRef.current },
                {
                  onSuccess: ({ data, message }) => {
                    toast.success(message);
                    onDone(data);
                  },
                },
              )
            }
            disabled={!ready || commit.isPending}
          >
            {commit.isPending ? <Spinner data-icon="inline-start" /> : <Upload data-icon="inline-start" />}
            {commit.isPending ? m.committing : commitLabel(summary)}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {tiles(summary).map((tile) => (
          <div key={tile.label} className="border bg-card p-3">
            <p className="text-muted-foreground text-xs">{tile.label}</p>
            <p
              className={cn(
                "mt-1 truncate font-medium text-2xl tabular-nums tracking-tight transition-opacity",
                tile.tone === "ok" && "text-emerald-600 dark:text-emerald-400",
                tile.tone === "error" && "text-destructive",
                checking && "opacity-50",
              )}
            >
              {tile.value}
            </p>
          </div>
        ))}
      </div>

      {header.missing.length > 0 && (
        <Alert variant="soft-destructive">
          <FileWarning aria-hidden="true" />
          <AlertDescription>{interpolate(m.missingColumns, { columns: columnList(header.missing) })}</AlertDescription>
        </Alert>
      )}
      {header.unknown.length > 0 && (
        <Alert variant="soft-warning">
          <TriangleAlert aria-hidden="true" />
          <AlertDescription>{interpolate(m.unknownColumns, { columns: header.unknown.join(", ") })}</AlertDescription>
        </Alert>
      )}

      <Alert variant={ready ? "soft-success" : "soft-destructive"} aria-live="polite">
        {ready ? <CircleCheck aria-hidden="true" /> : <CircleAlert aria-hidden="true" />}
        <AlertDescription>{ready ? m.allValid : m.hasErrors}</AlertDescription>
      </Alert>
      {commit.isError && (
        <Alert variant="soft-destructive">
          <CircleAlert aria-hidden="true" />
          <AlertDescription>{commit.error?.message}</AlertDescription>
        </Alert>
      )}

      <DataTable
        table={table}
        loading={false}
        fetching={checking}
        empty={{ icon: emptyIcon, title: m.noRows, description: m.noRowsDescription }}
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          toFirstPage();
        }}
        toolbar={
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  value={search}
                  placeholder={m.searchPlaceholder}
                  aria-label={m.searchPlaceholder}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    toFirstPage();
                  }}
                  className="h-7 w-full bg-background sm:w-72"
                />
                <ToggleGroup
                  type="single"
                  variant="outline"
                  size="sm"
                  aria-label={m.filterLabel}
                  value={filter}
                  onValueChange={(value) => {
                    if (!value) return;
                    setFilter(value as RowFilter);
                    setPinned(new Set());
                    setSortStatus(snapshotStatus());
                    toFirstPage();
                  }}
                >
                  {(["all", "valid", "invalid"] as const).map((value) => (
                    <ToggleGroupItem
                      key={value}
                      value={value}
                      disabled={counts[value] === 0 && filter !== value}
                      className={cn("gap-1.5", value === "invalid" && counts.invalid > 0 && "text-destructive")}
                    >
                      {m.filters[value]}
                      <span className="text-muted-foreground tabular-nums">{format.number(counts[value])}</span>
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
                <Select
                  value={sort}
                  onValueChange={(value) => {
                    setSort(value as RowSort);
                    setSortStatus(snapshotStatus());
                    toFirstPage();
                  }}
                >
                  <SelectTrigger size="sm" aria-label={m.sort.label} className="h-7 w-auto gap-1.5 bg-background">
                    <ArrowUpDown className="size-3.5 text-muted-foreground" aria-hidden="true" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper" align="start">
                    {ROW_SORTS.map((value) => (
                      <SelectItem key={value} value={value}>
                        {m.sort[value]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {checking && (
                  <span className="flex items-center gap-1.5 text-muted-foreground text-xs">
                    <Spinner className="size-3" />
                    {m.rechecking}
                  </span>
                )}
                {fixedCount > 0 && (
                  <Badge tone="success">{interpolate(m.fixedCount, { count: format.number(fixedCount) })}</Badge>
                )}
                {edited.size > 0 && (
                  <Badge tone="neutral">{interpolate(m.editedCount, { count: format.number(edited.size) })}</Badge>
                )}
                {invalidLines.length > 0 && (
                  <Button type="button" variant="outline" size="sm" onClick={() => setPending({ type: "invalid" })}>
                    <Trash2 data-icon="inline-start" />
                    {interpolate(m.deleteInvalid, { count: format.number(invalidLines.length) })}
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={records.length === 0}
                  onClick={() => downloadCsv(importColumns, allRows, fileName, errorText)}
                >
                  <Download data-icon="inline-start" />
                  {m.downloadData}
                </Button>
              </div>
            </div>
            <p className="text-muted-foreground text-xs">{m.editHint}</p>
          </div>
        }
      />

      {pending && (
        <ConfirmDialog
          open
          onOpenChange={(next) => !next && setPending(null)}
          tone="danger"
          title={
            pending.type === "row"
              ? interpolate(m.deleteRowTitle, { line: lineLabel(pending.line) })
              : interpolate(m.deleteInvalidTitle, { count: format.number(invalidLines.length) })
          }
          description={pending.type === "row" ? m.deleteRowDescription : m.deleteInvalidDescription}
          confirmLabel={m.deleteConfirm}
          cancelLabel={cancelLabel}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}
