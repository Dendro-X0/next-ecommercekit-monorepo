"use client"

import type React from "react"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * ChartSkeleton: simple aspect-video block for chart loading state.
 */
export type ChartSkeletonProps = Readonly<{
  className?: string
}>

export function ChartSkeleton({ className }: ChartSkeletonProps): React.ReactElement {
  return (
    <Skeleton className={["aspect-video w-full rounded-lg", className].filter(Boolean).join(" ")} />
  )
}
