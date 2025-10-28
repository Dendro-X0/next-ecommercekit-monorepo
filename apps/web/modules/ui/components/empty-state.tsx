"use client"

import type * as React from "react"
import { cn } from "@/lib/utils"

/**
 * EmptyState: reusable empty/blank state with optional icon and action.
 */
export type EmptyStateProps = Readonly<{
  icon?: React.ComponentType
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}>

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps): React.ReactElement {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-lg border border-border/50 bg-background p-6 text-center",
        className,
      )}
    >
      {Icon ? <Icon /> : null}
      <h2 className="text-sm font-semibold">{title}</h2>
      {description ? <p className="text-muted-foreground text-sm">{description}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  )
}
