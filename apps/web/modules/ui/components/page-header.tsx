"use client"

import type * as React from "react"
import { cn } from "@/lib/utils"

/**
 * PageHeader: title, optional description and actions.
 */
export type PageHeaderProps = Readonly<{
  title: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
  className?: string
}>

export function PageHeader({
  title,
  description,
  actions,
  className,
}: PageHeaderProps): React.ReactElement {
  return (
    <div
      className={cn(
        "mb-4 flex flex-col gap-2 md:mb-6 md:flex-row md:items-center md:justify-between",
        className,
      )}
    >
      <div>
        <h1 className="text-base font-semibold md:text-lg">{title}</h1>
        {description ? <p className="text-muted-foreground text-sm">{description}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  )
}
