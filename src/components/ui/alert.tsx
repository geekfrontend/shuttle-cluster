import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const alertVariants = cva(
  "group/alert relative grid w-full gap-0.5 rounded-none border px-2.5 py-2 text-left text-xs has-data-[slot=alert-action]:relative has-data-[slot=alert-action]:pr-18 has-[>svg]:grid-cols-[auto_1fr] has-[>svg]:gap-x-2 *:[svg]:row-span-2 *:[svg]:translate-y-0 not-has-data-[slot=alert-title]:*:[svg]:translate-y-0.5 *:[svg]:text-current *:[svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-card text-card-foreground",
        destructive:
          "bg-card text-destructive *:data-[slot=alert-description]:text-destructive/90 *:[svg]:text-current",
        "soft-info":
          "border-none bg-sky-600/10 text-sky-600 *:data-[slot=alert-description]:text-sky-600/80 dark:bg-sky-400/10 dark:text-sky-400 dark:*:data-[slot=alert-description]:text-sky-400/80",
        "soft-success":
          "border-none bg-green-600/10 text-green-600 *:data-[slot=alert-description]:text-green-600/80 dark:bg-green-400/10 dark:text-green-400 dark:*:data-[slot=alert-description]:text-green-400/80",
        "soft-warning":
          "border-none bg-amber-600/10 text-amber-600 *:data-[slot=alert-description]:text-amber-600/80 dark:bg-amber-400/10 dark:text-amber-400 dark:*:data-[slot=alert-description]:text-amber-400/80",
        "soft-destructive":
          "border-none bg-destructive/10 text-destructive *:data-[slot=alert-description]:text-destructive/80",
        "solid-info":
          "border-none bg-sky-600 text-white *:data-[slot=alert-description]:text-white/80 dark:bg-sky-400",
        "solid-success":
          "border-none bg-green-600 text-white *:data-[slot=alert-description]:text-white/80 dark:bg-green-400",
        "solid-warning":
          "border-none bg-amber-600 text-white *:data-[slot=alert-description]:text-white/80 dark:bg-amber-400",
        "solid-destructive":
          "border-none bg-destructive text-white *:data-[slot=alert-description]:text-white/80 dark:bg-destructive/60",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  )
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        "font-medium group-has-[>svg]/alert:col-start-2 [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground",
        className
      )}
      {...props}
    />
  )
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "text-xs/relaxed text-balance text-muted-foreground md:text-pretty [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground [&_p:not(:last-child)]:mb-2",
        className
      )}
      {...props}
    />
  )
}

function AlertAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-action"
      className={cn(
        "absolute top-[calc(--spacing(1.25))] right-[calc(--spacing(1.25))]",
        className
      )}
      {...props}
    />
  )
}

export { Alert, AlertTitle, AlertDescription, AlertAction }
