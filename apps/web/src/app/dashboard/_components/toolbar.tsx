"use client"

import type React from "react"
import { Toolbar as UIToolbar, type ToolbarProps as UIToolbarProps } from "@/components/ui/toolbar"

/**
 * Toolbar: dashboard-level wrapper over UI Toolbar.
 */
export type ToolbarProps = UIToolbarProps

export function Toolbar(props: ToolbarProps): React.ReactElement {
  return <UIToolbar {...props} />
}
