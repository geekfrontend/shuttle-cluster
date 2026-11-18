"use client";

import type { ReactNode } from "react";

import { cn } from "cn";
import { type LucideIcon, TriangleAlert } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Spinner } from "@/components/ui/spinner";

export type ConfirmTone = "danger" | "default";

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * `danger` untuk apa pun yang mengambil sesuatu — menghapus, menonaktifkan, menangguhkan,
   * membatalkan. `default` untuk langkah yang cukup dikonfirmasi, supaya keduanya tidak pernah
   * terlihat sama dan konfirmasi rutin tidak disangka tindakan destruktif.
   */
  tone?: ConfirmTone;
  /** Mengganti tanda bawaan tone. Pakai untuk menyatakan *apa* yang terdampak, bukan seberapa parah. */
  icon?: LucideIcon;
  title: ReactNode;
  description?: ReactNode;
  confirmLabel: ReactNode;
  cancelLabel: ReactNode;
  /** Mengunci tombol konfirmasi, batal, dan penutupan dialog — request sedang berjalan. */
  pending?: boolean;
  onConfirm: () => void;
  /** Apa pun yang dibutuhkan keputusan: kolom alasan, daftar yang terdampak. */
  children?: ReactNode;
}

/**
 * Dialog "apakah Anda yakin" dengan bingkai yang selalu sama: tanda, judul yang menyebut record,
 * deskripsi apa yang berubah, dan tombol batal yang tidak pernah terlihat lebih menakutkan.
 *
 * Belum satu-satunya — beberapa layar masih menyusun `AlertDialog` sendiri. Arahkan konfirmasi
 * baru lewat komponen ini, dan migrasikan sisanya saat layar tersebut disentuh.
 *
 * Tanpa i18n di dalamnya: semua label dikirim lewat props (dari `useMessages` pemanggil).
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  tone = "danger",
  icon,
  title,
  description,
  confirmLabel,
  cancelLabel,
  pending = false,
  onConfirm,
  children,
}: ConfirmDialogProps) {
  const Icon = icon ?? TriangleAlert;
  const isDanger = tone === "danger";

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next: boolean) => {
        // Menutup saat request berjalan membuat pemanggil tidak yakin apakah berhasil.
        if (!next && pending) return;
        onOpenChange(next);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <div
            aria-hidden
            className={cn(
              "mb-1 flex size-10 items-center justify-center",
              isDanger ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground",
            )}
          >
            <Icon className="size-5" />
          </div>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description ? <AlertDialogDescription>{description}</AlertDialogDescription> : null}
        </AlertDialogHeader>

        {children}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            type="button"
            variant={isDanger ? "destructive" : "default"}
            disabled={pending}
            onClick={(event) => {
              // Pemanggil yang menentukan kapan dialog ditutup — biasanya setelah request selesai.
              event.preventDefault();
              onConfirm();
            }}
          >
            {pending ? <Spinner data-icon="inline-start" /> : null}
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
