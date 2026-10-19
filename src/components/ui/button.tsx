import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Slot } from "radix-ui"

// Botão Lúmen: primário em `lumen` com texto `on-lumen`; secundário com borda
// `line-strong`; terciário só texto. Altura 44px, radius-md, foco com shadow-focus.
// Em tela de toque, os tamanhos menores também ficam com 44px (alvo confortável para o dedo).
const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-md border border-transparent font-medium whitespace-nowrap transition-colors outline-none select-none focus-visible:shadow-focus disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-danger [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg]:stroke-[1.5]",
  {
    variants: {
      variant: {
        primary: "bg-lumen text-on-lumen hover:bg-lumen-hover active:bg-lumen-hover",
        secondary:
          "border-line-strong bg-transparent text-ink hover:bg-surface-sunken active:bg-surface-sunken",
        tertiary: "bg-transparent text-ink hover:bg-surface-sunken active:bg-surface-sunken",
        link: "h-auto px-0 text-ink underline underline-offset-4 decoration-line-strong hover:decoration-ink",
      },
      size: {
        default: "h-11 px-4 text-body-sm",
        sm: "h-9 px-3 text-body-sm pointer-coarse:h-11",
        icon: "size-11",
        "icon-sm": "size-9 pointer-coarse:size-11",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "primary",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
