import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-neutral-700 text-neutral-100 hover:bg-neutral-600",
        secondary:
          "border-transparent bg-neutral-800 text-neutral-100 hover:bg-neutral-700",
        destructive:
          "border-transparent bg-red-600 text-neutral-50 hover:bg-red-700",
        outline: "text-neutral-100 border-neutral-600",
        success:
          "border-transparent bg-green-600 text-neutral-50 hover:bg-green-700",
        warning:
          "border-transparent bg-yellow-600 text-neutral-50 hover:bg-yellow-700",
        info:
          "border-transparent bg-blue-600 text-neutral-50 hover:bg-blue-700",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
