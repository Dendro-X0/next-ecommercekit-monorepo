"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * SkeletonTable: grid-like skeleton for loading table content.
 */
export type SkeletonTableProps = Readonly<{
  className?: string
  rows?: number
  columns?: number
}>

export function SkeletonTable({
  className,
  rows = 5,
  columns = 4,
}: SkeletonTableProps): React.ReactElement {
  const r = Math.max(1, Math.min(20, rows))
  const c = Math.max(1, Math.min(8, columns))
  const total = r * c
  const keys = React.useMemo<readonly string[]>(
    () =>
      Array.from(
        { length: total },
        () => globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2),
      ),
    [total],
  )
  return (
    <div className={cn("rounded-lg border border-border/50 p-3", className)}>
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${c}, minmax(0, 1fr))` }}>
        {keys.map((k) => (
          <div key={k} className="h-6 animate-pulse rounded bg-muted" />
        ))}
      </div>
    </div>
  )
}
