import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { Slot } from "radix-ui"

// Gaya "rich" (gradien, inset highlight, shadow, text shadow) untuk semua variant yang berisi.
// Text shadow diwariskan ke teks di dalam button, jadi tidak perlu elemen pembungkus.
const rich =
  "border-zinc-950/35 bg-linear-to-b shadow-md shadow-zinc-950/20 inset-shadow-2xs inset-shadow-white/25 text-shadow-2xs transition-[filter,translate] duration-200 hover:brightness-110 active:brightness-95 dark:border-0 dark:bg-linear-to-t"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-none border border-transparent bg-clip-padding text-xs font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-1 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        // Warna primary tema/preset aktif; bisa diganti lewat prop `tone` (lihat `richButtonTones`).
        default: `${rich} from-primary/85 to-primary text-primary-foreground text-shadow-black/30 dark:text-shadow-white/30`,
        outline:
          "border-border bg-linear-to-b from-background to-muted/60 shadow-sm shadow-zinc-950/5 inset-shadow-2xs inset-shadow-white/60 text-shadow-2xs text-shadow-white/60 hover:to-muted hover:text-foreground aria-expanded:to-muted aria-expanded:text-foreground dark:border-input dark:from-input/40 dark:to-input/20 dark:inset-shadow-white/5 dark:text-shadow-black/40 dark:hover:from-input/60 dark:hover:to-input/40",
        secondary:
          "border-zinc-950/10 bg-linear-to-b from-secondary/60 to-secondary text-secondary-foreground shadow-sm shadow-zinc-950/10 inset-shadow-2xs inset-shadow-white/60 text-shadow-2xs text-shadow-white/60 transition-[filter,translate] duration-200 hover:brightness-[0.97] active:brightness-95 aria-expanded:brightness-[0.97] dark:border-0 dark:bg-linear-to-t dark:inset-shadow-white/10 dark:text-shadow-black/40 dark:hover:brightness-110",
        ghost:
          "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
        destructive: `${rich} from-destructive/85 to-destructive text-white text-shadow-black/25 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:from-destructive/75 dark:focus-visible:ring-destructive/40`,
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 rounded-none px-2 text-xs has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-none px-2.5 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        icon: "size-8",
        "icon-xs": "size-6 rounded-none [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-7 rounded-none",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

// Pengganti warna gradien untuk `variant="default"`. `tone="default"` = primary (tanpa override).
const richButtonTones = {
  default: "",
  blue: "text-white from-blue-600/85 to-blue-600 text-shadow-blue-800 dark:from-blue-600/75",
  purple: "text-white from-purple-600/85 to-purple-600 text-shadow-purple-800 dark:from-purple-600/75",
  pink: "text-white from-pink-600/85 to-pink-600 text-shadow-pink-800 dark:from-pink-600/75",
  red: "text-white from-red-600/85 to-red-600 text-shadow-red-800 dark:from-red-600/75",
  orange: "text-white from-orange-600/85 to-orange-600 text-shadow-orange-800 dark:from-orange-600/75",
  yellow: "text-white from-yellow-600/85 to-yellow-600 text-shadow-yellow-800 dark:from-yellow-600/75",
  green: "text-white from-green-600/85 to-green-600 text-shadow-green-800 dark:from-green-600/75",
  teal: "text-white from-teal-600/85 to-teal-600 text-shadow-teal-800 dark:from-teal-600/75",
  cyan: "text-white from-cyan-600/85 to-cyan-600 text-shadow-cyan-800 dark:from-cyan-600/75",
  indigo: "text-white from-indigo-600/85 to-indigo-600 text-shadow-indigo-800 dark:from-indigo-600/75",
  violet: "text-white from-violet-600/85 to-violet-600 text-shadow-violet-800 dark:from-violet-600/75",
  rose: "text-white from-rose-600/85 to-rose-600 text-shadow-rose-800 dark:from-rose-600/75",
  amber: "text-white from-amber-600/85 to-amber-600 text-shadow-amber-800 dark:from-amber-600/75",
  lime: "text-white from-lime-600/85 to-lime-600 text-shadow-lime-800 dark:from-lime-600/75",
  sky: "text-white from-sky-600/85 to-sky-600 text-shadow-sky-800 dark:from-sky-600/75",
  slate: "text-white from-slate-600/85 to-slate-600 text-shadow-slate-800 dark:from-slate-600/75",
  gray: "text-white from-gray-600/85 to-gray-600 text-shadow-gray-800 dark:from-gray-600/75",
  zinc: "text-white from-zinc-700/85 to-zinc-700 text-shadow-zinc-800 dark:from-zinc-700/75",
  neutral: "text-white from-neutral-600/85 to-neutral-600 text-shadow-neutral-800 dark:from-neutral-600/75",
  stone: "text-white from-stone-600/85 to-stone-600 text-shadow-stone-800 dark:from-stone-600/75",
  fuchsia: "text-white from-fuchsia-600/85 to-fuchsia-600 text-shadow-fuchsia-800 dark:from-fuchsia-600/75",
  emerald: "text-white from-emerald-600/85 to-emerald-600 text-shadow-emerald-800 dark:from-emerald-600/75",
} as const

type RichButtonTone = keyof typeof richButtonTones

function Button({
  className,
  variant = "default",
  size = "default",
  tone = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    /** Warna gradien; hanya berlaku untuk `variant="default"`. */
    tone?: RichButtonTone
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      data-tone={variant === "default" ? tone : undefined}
      data-rich={variant === "ghost" || variant === "link" ? undefined : ""}
      className={cn(
        buttonVariants({ variant, size }),
        variant === "default" && richButtonTones[tone],
        className
      )}
      {...props}
    />
  )
}

export { Button, buttonVariants, richButtonTones, type RichButtonTone }
