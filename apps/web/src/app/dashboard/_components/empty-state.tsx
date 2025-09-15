"use client"

import type React from "react"
import {
  EmptyState as UIEmptyState,
  type EmptyStateProps as UIEmptyStateProps,
} from "@/components/ui/empty-state"

/**
 * DashboardEmptyState: wrapper over UI EmptyState with variant-driven ARIA roles.
 */
export type DashboardEmptyStateProps = Readonly<{
  icon?: UIEmptyStateProps["icon"]
  title: string
  description?: string
  primaryAction?: React.ReactNode
  secondaryAction?: React.ReactNode
  variant?: "empty" | "no-results" | "error" | "permission"
  className?: string
}>

export function DashboardEmptyState({
  icon,
  title,
  description,
  primaryAction,
  secondaryAction,
  variant = "empty",
  className,
}: DashboardEmptyStateProps): React.ReactElement {
  const role: "status" | "alert" =
    variant === "error" || variant === "permission" ? "alert" : "status"
  const ariaLive: "off" | "polite" | "assertive" = role === "alert" ? "assertive" : "polite"
  return (
    <div role={role} aria-live={ariaLive}>
      <UIEmptyState
        icon={icon}
        title={title}
        description={description}
        action={
          primaryAction || secondaryAction ? (
            <div className="flex items-center justify-center gap-2">
              {secondaryAction}
              {primaryAction}
            </div>
          ) : undefined
        }
        className={className}
      />
    </div>
  )
}
