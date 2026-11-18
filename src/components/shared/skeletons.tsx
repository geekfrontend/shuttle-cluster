import type { ReactNode } from "react";

import { cn } from "cn";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TableCell, TableRow } from "@/components/ui/table";

/**
 * Bentuk loading yang memprediksi layout yang digantikannya.
 *
 * Skeleton adalah janji tentang apa yang akan muncul. Tumpukan bar yang seragam tidak menjanjikan
 * apa-apa: ia hanya bilang "sesuatu akan datang", lalu halaman bergeser di bawah pembaca saat data
 * tiba. Potongan di sini ada supaya layar bisa menggambarkan bentuknya sendiri — blok, urutan, dan
 * lebar yang sama — sehingga satu-satunya perubahan saat data tiba adalah abu-abu menjadi konten.
 *
 * Sengaja kecil. Susun menjadi skeleton milik satu layar; jangan membuat "page skeleton" generik.
 * Ukuran mengikuti design system (style radix-lyra, sudut siku): `Input` `h-8`, sel `DataTable` `py-1.5`.
 */

/** Paragraf. Baris terakhir pendek karena baris terakhir prosa asli biasanya begitu. */
export function SkeletonText({ lines = 2, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }, (_, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: placeholder statis tanpa identitas
        <Skeleton key={`line-${index}`} className={cn("h-4", index === lines - 1 ? "w-3/5" : "w-full")} />
      ))}
    </div>
  );
}

/** Label di atas kontrol, seukuran `Input` asli (`h-8`). */
export function SkeletonField({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-8 w-full" />
    </div>
  );
}

/**
 * Grid field form. `fullWidth` berisi posisi (mulai 0) yang membentang dua kolom, supaya skeleton
 * meniru ritme form yang sebenarnya, bukan grid rata yang tidak pernah dipakai form itu.
 */
export function SkeletonFieldGrid({
  fields = 6,
  fullWidth = [],
  className,
}: {
  fields?: number;
  fullWidth?: number[];
  className?: string;
}) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2", className)}>
      {Array.from({ length: fields }, (_, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: placeholder statis tanpa identitas
        <SkeletonField key={`field-${index}`} className={fullWidth.includes(index) ? "sm:col-span-2" : undefined} />
      ))}
    </div>
  );
}

/** Avatar/monogram di samping nama dan satu baris keterangan. */
export function SkeletonIdentity({ className, avatarClassName }: { className?: string; avatarClassName?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Skeleton className={cn("size-8 shrink-0", avatarClassName)} />
      <div className="min-w-0 flex-1 space-y-1.5">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  );
}

/** Kartu KPI seperti `StatCard` dasbor: kotak ikon, label, angka besar, dan catatan kaki. */
export function SkeletonStatCards({ count = 4, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 xl:grid-cols-4", className)}>
      {Array.from({ length: count }, (_, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: placeholder statis tanpa identitas
        <Card className="min-w-0" key={`stat-${index}`}>
          <CardContent className="grid gap-3">
            <Skeleton className="size-7" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-3 w-28" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/** Grid kotak fakta kecil ber-border — keterangan di atas nilai. */
export function SkeletonInfoTiles({ count = 4, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("grid gap-3 sm:grid-cols-2 lg:grid-cols-4", className)}>
      {Array.from({ length: count }, (_, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: placeholder statis tanpa identitas
        <div className="border p-3" key={`tile-${index}`}>
          <Skeleton className="h-3 w-16" />
          <Skeleton className="mt-2 h-4 w-12" />
        </div>
      ))}
    </div>
  );
}

/** Baris di dalam kartu daftar: identitas di kiri, badge status di kanan. */
export function SkeletonListRows({ rows = 4, className }: { rows?: number; className?: string }) {
  return (
    <div className={className}>
      {Array.from({ length: rows }, (_, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: placeholder statis tanpa identitas
        <div className="flex items-center justify-between gap-3 border-b p-3 last:border-0" key={`row-${index}`}>
          <SkeletonIdentity />
          <Skeleton className="h-5 w-16 shrink-0" />
        </div>
      ))}
    </div>
  );
}

/**
 * Toolbar di atas koleksi, mengikuti `DataTableToolbar`: kotak cari `sm:w-64` (`h-7`), filter,
 * lalu tombol View di ujung kanan.
 */
export function SkeletonToolbar({ filters = 2, view = true }: { filters?: number; view?: boolean }) {
  return (
    <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-1 flex-wrap items-center gap-1.5">
        <Skeleton className="h-7 w-full sm:w-64" />
        {Array.from({ length: filters }, (_, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: placeholder statis tanpa identitas
          <Skeleton className="h-7 w-24" key={`filter-${index}`} />
        ))}
      </div>
      {view ? <Skeleton className="hidden h-7 w-20 lg:block" /> : null}
    </div>
  );
}

/**
 * Bentuk satu sel tabel saat loading. Dinamai menurut jenis nilai kolom, bukan ukuran, supaya kolom
 * yang formatnya berubah tetap memakai placeholder yang tepat.
 */
export type SkeletonCellShape =
  | "select"
  | "identity"
  | "stacked"
  | "text"
  | "short"
  | "number"
  | "money"
  | "badge"
  | "actions"
  | "button"
  | "actionGroup";

function shapeContent(shape: SkeletonCellShape): ReactNode {
  switch (shape) {
    case "select":
      return <Skeleton className="size-4" />;
    case "identity":
      return <SkeletonIdentity avatarClassName="size-6" />;
    case "stacked":
      return (
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-16" />
        </div>
      );
    case "short":
      return <Skeleton className="h-4 w-20" />;
    case "number":
      return <Skeleton className="h-4 w-8" />;
    case "money":
      return <Skeleton className="h-4 w-24" />;
    case "badge":
      return <Skeleton className="h-5 w-16" />;
    case "actions":
      return (
        <div className="flex items-center justify-end">
          <Skeleton className="size-7" />
        </div>
      );
    case "button":
      return (
        <div className="flex items-center justify-end">
          <Skeleton className="h-7 w-20" />
        </div>
      );
    case "actionGroup":
      return (
        <div className="flex items-center justify-end gap-0.5">
          <Skeleton className="size-7" />
          <Skeleton className="size-7" />
        </div>
      );
    default:
      return <Skeleton className="h-4 w-full" />;
  }
}

export interface SkeletonColumn {
  id: string;
  shape: SkeletonCellShape;
  /** Bawa kelas perataan / responsive-hiding milik kolom supaya grid tidak bergeser. */
  className?: string;
}

/**
 * Baris placeholder untuk body tabel. Render *di dalam* `<Table>` asli — header, toolbar, dan
 * pagination tetap hidup, jadi lebar kolom yang akan diterima pembaca sudah tampil dan tidak ada
 * yang bergeser saat data datang.
 */
export function SkeletonTableRows({
  rows = 5,
  columns,
  cellClassName,
}: {
  rows?: number;
  columns: SkeletonColumn[];
  cellClassName?: string;
}) {
  return (
    <>
      {Array.from({ length: rows }, (_, rowIndex) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: placeholder statis tanpa identitas
        <TableRow className="border-border/60 hover:bg-transparent" key={`skeleton-row-${rowIndex}`}>
          {columns.map((column) => (
            <TableCell className={cn("py-1.5 align-middle", cellClassName, column.className)} key={column.id}>
              {shapeContent(column.shape)}
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}
