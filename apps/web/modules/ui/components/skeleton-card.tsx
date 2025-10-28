"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * SkeletonCard: simple loading placeholder block.
 */
export type SkeletonCardProps = Readonly<{
  className?: string
  lines?: number
}>

export function SkeletonCard({ className, lines = 3 }: SkeletonCardProps): React.ReactElement {
  const count = Math.max(1, Math.min(8, lines))
  const keys = React.useMemo<readonly string[]>(
    () =>
      Array.from(
        { length: count },
        () => globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2),
      ),
    [count],
  )
  return (
    <div className={cn("rounded-lg border border-border/50 bg-muted/30 p-4", className)}>
      {keys.map((k, i) => (
        <div
          key={k}
          className={cn("animate-pulse rounded bg-muted", i === 0 ? "h-5 w-1/3" : "mt-3 h-3 w-2/3")}
        />
      ))}
    </div>
  )
}
