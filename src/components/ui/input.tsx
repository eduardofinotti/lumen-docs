import * as React from "react"
import { cn } from "@/lib/utils"

// Input Lúmen: 44px, radius-md, borda `line`; em foco, borda `line-strong` + shadow-focus.
const inputClasses =
  "h-11 w-full min-w-0 rounded-md border border-line bg-surface-raised px-3 text-body text-ink transition-colors outline-none placeholder:text-ink-muted focus-visible:border-line-strong focus-visible:shadow-focus disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-danger"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(inputClasses, className)}
      {...props}
    />
  )
}

export { Input, inputClasses }
