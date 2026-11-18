"use client";

import type { ComponentProps, ReactNode } from "react";

import Link from "next/link";

import { Ellipsis, Eye } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { workspaceMessages } from "@/features/workspace/messages";
import { useMessages } from "@/lib/i18n/locale-provider";
import { interpolate } from "@/lib/i18n/ui";

/**
 * Isi kolom aksi (header tanpa label): tombol lihat detail (ikon mata) lalu menu ⋯ opsional.
 * `view`: `DataTableViewLink` (halaman detail) atau `DataTableDetailDialog` (tanpa halaman detail).
 */
export function DataTableRowActions({
  name,
  view,
  children,
}: {
  /** Nama baris untuk label aksesibilitas. */
  readonly name: string;
  readonly view?: ReactNode;
  /** Item `DropdownMenuItem` untuk menu ⋯. */
  readonly children?: ReactNode;
}) {
  const m = useMessages(workspaceMessages).table;
  return (
    <div className="flex items-center justify-end gap-0.5">
      {view}
      {children && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground data-[state=open]:bg-muted"
              aria-label={interpolate(m.moreActions, { name })}
            >
              <Ellipsis />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-44">
            {children}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

/** Tombol ikon mata. `children` (mis. `<Link>` untuk `asChild`) menggantikan ikon bawaan. */
function ViewButton({ name, children, ...props }: ComponentProps<typeof Button> & { readonly name: string }) {
  const m = useMessages(workspaceMessages).table;
  const label = interpolate(m.viewItem, { name });
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      className="text-muted-foreground hover:text-foreground"
      aria-label={label}
      title={m.viewDetails}
      {...props}
    >
      {children ?? <Eye />}
    </Button>
  );
}

/** Ikon mata yang membuka halaman detail. */
export function DataTableViewLink({ href, name }: { readonly href: string; readonly name: string }) {
  return (
    <ViewButton name={name} asChild>
      <Link href={href}>
        <Eye />
      </Link>
    </ViewButton>
  );
}

export type DetailItem = { label: string; value: ReactNode; mono?: boolean; wide?: boolean };

/** Ikon mata yang membuka dialog detail baca-saja (untuk tabel tanpa halaman detail). */
export function DataTableDetailDialog({
  name,
  title,
  description,
  items,
  children,
}: {
  readonly name: string;
  readonly title: ReactNode;
  readonly description?: ReactNode;
  readonly items: DetailItem[];
  /** Konten tambahan di bawah daftar detail. */
  readonly children?: ReactNode;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <ViewButton name={name} />
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <dl className="grid gap-x-4 gap-y-3 sm:grid-cols-2">
          {items.map((item) => (
            <div key={item.label} className={item.wide ? "grid gap-0.5 sm:col-span-2" : "grid gap-0.5"}>
              <dt className="text-muted-foreground text-xs">{item.label}</dt>
              <dd className={item.mono ? "break-all font-mono text-xs" : "tabular-nums"}>{item.value}</dd>
            </div>
          ))}
        </dl>
        {children}
      </DialogContent>
    </Dialog>
  );
}
