"use client"

import type React from "react"
import { Section as UISection, type SectionProps as UISectionProps } from "@/components/ui/section"

/**
 * Section: dashboard-level wrapper over UI Section.
 */
export type SectionProps = UISectionProps

export function Section(props: SectionProps): React.ReactElement {
  return <UISection {...props} />
}
