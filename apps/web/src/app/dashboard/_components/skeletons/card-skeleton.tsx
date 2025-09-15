"use client"

import type React from "react"
import { SkeletonCard, type SkeletonCardProps } from "@/components/ui/skeleton-card"

/**
 * CardSkeleton: dashboard-level wrapper for card loading state.
 */
export type CardSkeletonProps = SkeletonCardProps

export function CardSkeleton(props: CardSkeletonProps): React.ReactElement {
  return <SkeletonCard {...props} />
}
