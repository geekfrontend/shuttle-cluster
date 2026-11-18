"use client"

import * as React from "react"
import { Eye, EyeOff } from "lucide-react"

import { Input, type InputProps } from "@/components/ui/input"

type PasswordInputProps = Omit<InputProps, "type" | "endAddon"> & {
  /** Label aksesibilitas tombol saat kata sandi tersembunyi. */
  showLabel?: string
  /** Label aksesibilitas tombol saat kata sandi terlihat. */
  hideLabel?: string
}

/** Input kata sandi dengan tombol tampil/sembunyikan (dibangun di atas `Input` + addon). */
function PasswordInput({
  showLabel = "Show password",
  hideLabel = "Hide password",
  disabled,
  ...props
}: PasswordInputProps) {
  const [visible, setVisible] = React.useState(false)
  const label = visible ? hideLabel : showLabel

  return (
    <Input
      {...props}
      disabled={disabled}
      type={visible ? "text" : "password"}
      endAddon={
        <button
          type="button"
          disabled={disabled}
          onClick={() => setVisible((current) => !current)}
          aria-label={label}
          aria-pressed={visible}
          title={label}
          className="flex size-7 items-center justify-center text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:ring-1 focus-visible:ring-ring/50 disabled:pointer-events-none"
        >
          {visible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
        </button>
      }
    />
  )
}

export { PasswordInput }
export type { PasswordInputProps }
