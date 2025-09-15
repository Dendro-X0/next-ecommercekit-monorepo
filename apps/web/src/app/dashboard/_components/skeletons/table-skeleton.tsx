"use client"

import type React from "react"
import { SkeletonTable, type SkeletonTableProps } from "@/components/ui/skeleton-table"

/**
 * TableSkeleton: dashboard-level wrapper for table loading state.
 */
export type TableSkeletonProps = SkeletonTableProps

export function TableSkeleton(props: TableSkeletonProps): React.ReactElement {
  return <SkeletonTable {...props} />
}
