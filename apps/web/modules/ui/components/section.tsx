"use client"

import type * as React from "react"
import { cn } from "@/lib/utils"

/**
 * Section: standardized page section wrapper with consistent spacing.
 */
export type SectionProps = Readonly<{
  className?: string
  children: React.ReactNode
  role?: string
}>

export function Section({ className, children, role }: SectionProps): React.ReactElement {
  return (
    <section
      role={role}
      className={cn("mx-auto w-full max-w-7xl px-4 py-6 md:px-6 md:py-8", className)}
    >
      {children}
    </section>
  )
}
