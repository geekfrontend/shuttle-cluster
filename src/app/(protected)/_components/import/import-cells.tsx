"use client";

import { useRef, useState } from "react";

import { cn } from "cn";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/**
 * Tanda sel: `fixed` = sempat error lalu lolos setelah diedit (hijau), `edited` = diubah tanpa pernah error
 * (tipis), `ready` = sel lain di baris yang siap diimpor (hijau sangat tipis). Sel yang masih error selalu merah.
 */
export type CellMark = "fixed" | "edited" | "ready";

const MARK_CLASS: Record<CellMark, string> = {
  // Varian `dark:` wajib: Input & SelectTrigger punya `dark:bg-input/30` bawaan yang menimpa latar biasa.
  fixed:
    "border-emerald-500 bg-emerald-500/20 font-medium text-emerald-800 dark:bg-emerald-500/25 dark:text-emerald-300",
  edited: "bg-primary/6 dark:bg-primary/15",
  ready: "border-emerald-500/30 bg-emerald-500/12 text-emerald-900 dark:bg-emerald-500/15 dark:text-emerald-200",
};

const ERROR_CLASS = "border-destructive/50 bg-destructive/5 text-destructive dark:bg-destructive/15";

export type Choice = { value: string; label: string; hint?: string };

/** Nilai item "kosongkan" (Radix Select tidak menerima string kosong sebagai nilai item). */
const EMPTY_CHOICE = "__empty";

type CellProps = {
  readonly value: string;
  readonly label: string;
  readonly error?: string;
  readonly mark?: CellMark;
  readonly className?: string;
  readonly onCommit: (value: string) => void;
};

/**
 * Sel pilihan untuk kolom yang nilainya tetap. `selected` = pilihan yang cocok dengan isi sel (alias sudah
 * dibakukan); isi yang tidak dikenal tetap ditampilkan apa adanya (merah) sampai diganti. Memilih menulis
 * nilai baku ke sel.
 */
export function SelectCell({
  value,
  selected,
  choices,
  emptyLabel,
  label,
  error,
  mark,
  className,
  onCommit,
}: CellProps & {
  readonly selected: string | undefined;
  readonly choices: Choice[];
  /** Diisi bila sel boleh dikosongkan. */
  readonly emptyLabel?: string;
}) {
  const current = selected ?? (!value && emptyLabel ? EMPTY_CHOICE : "");
  // Tombol hanya menampilkan label (mis. kode produk), bukan isi item lengkap beserta keterangannya.
  const display = current === EMPTY_CHOICE ? emptyLabel : choices.find((choice) => choice.value === current)?.label;
  return (
    <Select
      value={current}
      onValueChange={(next) => {
        const raw = next === EMPTY_CHOICE ? "" : next;
        if (raw !== value) onCommit(raw);
      }}
    >
      <SelectTrigger
        size="sm"
        aria-label={label}
        aria-invalid={Boolean(error)}
        title={error}
        className={cn(
          "h-7 border-transparent bg-transparent px-1.5 text-xs shadow-none hover:border-input",
          // Merah (error) ditulis sesudahnya, jadi selalu menang atas tanda hijau/tipis.
          mark && MARK_CLASS[mark],
          error && `${ERROR_CLASS} data-placeholder:text-destructive`,
          className,
        )}
      >
        {/* Isi yang tidak cocok dengan pilihan mana pun ditampilkan mentah sebagai placeholder. */}
        <SelectValue placeholder={value}>{display}</SelectValue>
      </SelectTrigger>
      {/* `popper`: posisi di bawah tombol; `item-aligned` bawaan melompat di dalam tabel yang bisa digulir. */}
      <SelectContent position="popper" align="start" className="min-w-48">
        {emptyLabel && (
          <SelectItem value={EMPTY_CHOICE} className="text-muted-foreground text-xs">
            {emptyLabel}
          </SelectItem>
        )}
        {choices.map((choice) => (
          <SelectItem key={choice.value} value={choice.value} className="text-xs">
            <span className="grid leading-tight">
              <span>{choice.label}</span>
              {choice.hint && <span className="text-[0.625rem] text-muted-foreground">{choice.hint}</span>}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/**
 * Sel yang bisa langsung diedit. Perubahan dikirim saat keluar dari sel atau Enter; Escape membatalkan.
 * `key` pemanggil menyertakan nilai, jadi draf ikut ter-reset saat nilai berubah dari luar.
 */
export function EditableCell({
  value,
  label,
  error,
  mark,
  placeholder,
  className,
  onCommit,
}: CellProps & { readonly placeholder?: string }) {
  const [draft, setDraft] = useState(value);
  const skip = useRef<boolean>(false);
  return (
    <Input
      value={draft}
      aria-label={label}
      aria-invalid={Boolean(error)}
      title={error}
      placeholder={placeholder}
      autoComplete="off"
      spellCheck={false}
      maxLength={255}
      onChange={(event) => setDraft(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === "Enter") event.currentTarget.blur();
        if (event.key === "Escape") {
          skip.current = true;
          setDraft(value);
          event.currentTarget.blur();
        }
      }}
      onBlur={() => {
        if (skip.current) {
          skip.current = false;
          return;
        }
        if (draft.trim() !== value.trim()) onCommit(draft.trim());
      }}
      className={cn(
        "h-7 border-transparent bg-transparent px-1.5 text-xs shadow-none hover:border-input focus-visible:bg-background",
        // Merah (error) ditulis sesudahnya, jadi selalu menang atas tanda hijau/tipis.
        mark && MARK_CLASS[mark],
        error && ERROR_CLASS,
        className,
      )}
    />
  );
}
