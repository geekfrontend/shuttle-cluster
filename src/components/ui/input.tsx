import * as React from "react"
import { cn } from "cn"

const inputClassName =
  "h-8 w-full min-w-0 rounded-none border border-input bg-transparent px-2.5 py-1 text-xs transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-xs file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-1 aria-invalid:ring-destructive/20 md:text-xs dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40"

// Addon teks (mis. "Rp", "%") tampil sebagai kotak; addon berisi tombol tampil polos.
const addonClassName =
  "flex h-full shrink-0 items-center gap-1 bg-muted/60 px-2.5 text-xs text-muted-foreground select-none has-[button]:bg-transparent has-[button]:px-0.5 [&_svg:not([class*='size-'])]:size-4"

type InputProps = React.ComponentProps<"input"> & {
  /** Konten di depan input, mis. `"Rp"` atau ikon. */
  startAddon?: React.ReactNode
  /** Konten di belakang input, mis. `"%"` atau tombol. */
  endAddon?: React.ReactNode
  /** Kelas untuk pembungkus saat ada addon (tinggi/lebar berlaku di sini). */
  containerClassName?: string
}

function Input({
  className,
  type,
  startAddon,
  endAddon,
  containerClassName,
  ...props
}: InputProps) {
  const hasAddon = startAddon != null || endAddon != null

  if (!hasAddon) {
    return (
      <input
        type={type}
        data-slot="input"
        className={cn(inputClassName, className)}
        {...props}
      />
    )
  }

  // Dengan addon: border, ring fokus, dan status error dipindah ke pembungkus.
  return (
    <div
      data-slot="input-addon-group"
      className={cn(
        "group/input relative flex h-8 w-full min-w-0 items-center overflow-hidden border border-input transition-colors dark:bg-input/30",
        "has-[input:focus-visible]:border-ring has-[input:focus-visible]:ring-1 has-[input:focus-visible]:ring-ring/50",
        "has-[input[aria-invalid=true]]:border-destructive has-[input[aria-invalid=true]]:ring-1 has-[input[aria-invalid=true]]:ring-destructive/20 dark:has-[input[aria-invalid=true]]:ring-destructive/40",
        "has-[input:disabled]:cursor-not-allowed has-[input:disabled]:bg-input/50 has-[input:disabled]:opacity-50",
        containerClassName
      )}
    >
      {startAddon != null && (
        <span data-slot="input-addon" data-align="start" className={cn(addonClassName, "border-r")}>
          {startAddon}
        </span>
      )}
      <input
        type={type}
        data-slot="input"
        className={cn(
          inputClassName,
          "h-full flex-1 border-0 bg-transparent ring-0 focus-visible:ring-0 aria-invalid:ring-0 dark:bg-transparent",
          className
        )}
        {...props}
      />
      {endAddon != null && (
        <span data-slot="input-addon" data-align="end" className={cn(addonClassName, "border-l has-[button]:border-l-0")}>
          {endAddon}
        </span>
      )}
    </div>
  )
}

export { Input }
export type { InputProps }
