import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const statusDotVariants = cva(
  "inline-block rounded-full",
  {
    variants: {
      status: {
        online: "bg-accent",
        offline: "bg-muted",
        error: "bg-danger",
        warning: "bg-yellow-500",
      },
      size: {
        sm: "w-2 h-2",
        md: "w-3 h-3",
        lg: "w-4 h-4",
      },
    },
    defaultVariants: {
      status: "online",
      size: "md",
    },
  }
)

export interface StatusDotProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusDotVariants> {}

function StatusDot({ className, status, size, ...props }: StatusDotProps) {
  return (
    <span className={cn(statusDotVariants({ status, size }), className)} {...props} />
  )
}

export { StatusDot, statusDotVariants }
