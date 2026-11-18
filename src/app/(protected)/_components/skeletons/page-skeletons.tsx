import type { ReactNode } from "react";

import { cn } from "cn";

import { type SkeletonColumn, SkeletonTableRows, SkeletonToolbar } from "@/components/shared/skeletons";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";

/**
 * Potongan skeleton untuk halaman di dalam layout `(protected)`. Setiap `loading.tsx` menyusunnya
 * menjadi bentuk halamannya sendiri (heading, tab, tabel, kartu) dengan ukuran yang sama dengan
 * komponen aslinya, jadi saat data tiba hanya abu-abu yang berganti menjadi konten.
 */

/** Wrapper halaman: `role="status"` supaya pembaca layar tahu halaman sedang dimuat. */
export function PageSkeleton({ label, children }: { readonly label: string; readonly children: ReactNode }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className="flex flex-col gap-4">
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

/** Heading halaman daftar: judul `text-3xl`, deskripsi, dan tombol aksi di kanan. */
export function PageHeaderSkeleton({ actions = 0 }: { readonly actions?: number }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="grid gap-2">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      {actions > 0 && (
        <div className="flex gap-2">
          {Array.from({ length: actions }, (_, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: placeholder statis
            <Skeleton key={index} className="h-8 w-32" />
          ))}
        </div>
      )}
    </div>
  );
}

/** Heading halaman detail: nama, badge, kode mono, aksi + tombol kembali, lalu garis pemisah. */
export function DetailHeaderSkeleton({
  badges = 1,
  actions = 0,
}: {
  readonly badges?: number;
  readonly actions?: number;
}) {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <Skeleton className="h-9 w-64" />
          {Array.from({ length: badges }, (_, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: placeholder statis
            <Skeleton key={index} className="h-5 w-16" />
          ))}
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="flex gap-2">
          {Array.from({ length: actions }, (_, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: placeholder statis
            <Skeleton key={index} className="h-7 w-24" />
          ))}
          <Skeleton className="h-7 w-24" />
        </div>
      </div>
      <Separator />
    </>
  );
}

/** Tab horizontal `PageTabs`: tinggi `h-10` dengan garis dasar. */
export function TabsSkeleton({ tabs }: { readonly tabs: number }) {
  return (
    <div className="flex h-10 items-center gap-6 px-3 shadow-[inset_0_-1px_0_var(--border)]">
      {Array.from({ length: tabs }, (_, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: placeholder statis
        <Skeleton key={index} className="h-4 w-24" />
      ))}
    </div>
  );
}

/** Container `DataTable`: toolbar, header, baris sesuai bentuk kolom, dan footer pagination. */
export function DataTableSkeleton({
  columns,
  filters = 1,
  search = true,
  rows = 5,
}: {
  readonly columns: SkeletonColumn[];
  readonly filters?: number;
  readonly search?: boolean;
  readonly rows?: number;
}) {
  return (
    <div className="overflow-hidden border border-border/70 bg-background">
      <div className="border-b px-3 py-2">
        {search ? (
          <SkeletonToolbar filters={filters} />
        ) : (
          <div className="flex gap-1.5">
            {Array.from({ length: filters }, (_, index) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: placeholder statis
              <Skeleton key={index} className="h-7 w-24" />
            ))}
          </div>
        )}
      </div>
      <Table className="**:data-[slot=table-cell]:px-3 **:data-[slot=table-head]:px-3">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {columns.map((column) => (
              <TableHead key={column.id} className={cn("h-8", column.className)}>
                {column.shape !== "actions" && <Skeleton className="h-3 w-16" />}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          <SkeletonTableRows rows={rows} columns={columns} />
        </TableBody>
      </Table>
      <div className="flex flex-col gap-2 border-t px-3 py-2 md:flex-row md:items-center md:justify-between">
        <Skeleton className="h-4 w-20" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-7 w-36" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-7 w-44" />
        </div>
      </div>
    </div>
  );
}

/** Kartu ber-header seperti form & ringkasan: judul, deskripsi, isi, dan footer tombol opsional. */
export function CardSkeleton({
  children,
  description = true,
  footer = false,
  className,
}: {
  readonly children: ReactNode;
  readonly description?: boolean;
  readonly footer?: boolean;
  readonly className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader className="gap-2 border-b">
        <Skeleton className="h-5 w-40" />
        {description && <Skeleton className="h-4 w-72 max-w-full" />}
      </CardHeader>
      <CardContent className="grid gap-4">{children}</CardContent>
      {footer && (
        <CardFooter className="justify-end border-t">
          <Skeleton className="h-7 w-28" />
        </CardFooter>
      )}
    </Card>
  );
}

/** Daftar keterangan (`dl`): label kecil di atas nilai, dalam grid. */
export function DescriptionListSkeleton({
  items = 6,
  className = "sm:grid-cols-2",
}: {
  readonly items?: number;
  readonly className?: string;
}) {
  return (
    <div className={cn("grid gap-4", className)}>
      {Array.from({ length: items }, (_, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: placeholder statis
        <div key={index} className="grid gap-1.5">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-4 w-36" />
        </div>
      ))}
    </div>
  );
}

/**
 * Judul bagian `h3` di atas tabel di dalam tab/dasbor: deskripsi opsional, dan di kanan tombol
 * aksi (`action`) atau tautan kecil "Lihat semua" (`link`).
 */
export function SectionHeaderSkeleton({
  description = true,
  action = false,
  link = false,
}: {
  readonly description?: boolean;
  readonly action?: boolean;
  readonly link?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="grid gap-2">
        <Skeleton className="h-6 w-40" />
        {description && <Skeleton className="h-4 w-64 max-w-full" />}
      </div>
      {action && <Skeleton className="h-8 w-36" />}
      {link && <Skeleton className="h-3 w-16" />}
    </div>
  );
}
