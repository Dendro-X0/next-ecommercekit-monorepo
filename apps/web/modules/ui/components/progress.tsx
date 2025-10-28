"use client"

import * as ProgressPrimitive from "@radix-ui/react-progress"
import type * as React from "react"

import { cn } from "@/lib/utils"

function Progress({ className, value = 0, ...rest }: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  const labelledBy = (rest as Record<string, unknown>)["aria-labelledby"] as string | undefined
  const ariaLabel = (rest as Record<string, unknown>)["aria-label"] as string | undefined
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.max(0, Math.min(100, Number(value)))}
      aria-label={ariaLabel ?? (labelledBy ? undefined : "Progress")}
      className={cn("bg-primary/20 relative h-2 w-full overflow-hidden rounded-full", className)}
      {...(rest as React.ComponentProps<typeof ProgressPrimitive.Root>)}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className="bg-primary h-full w-full flex-1 transition-all"
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }
