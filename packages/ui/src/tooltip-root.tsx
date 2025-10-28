"use client"

import * as Tooltip from "@radix-ui/react-tooltip"
import type * as React from "react"

type TooltipRootProps = React.ComponentPropsWithoutRef<typeof Tooltip.Root>

/**
 * TooltipRoot wraps Radix Tooltip.Root.
 */
export function TooltipRoot(props: TooltipRootProps): React.JSX.Element {
  return <Tooltip.Root {...props} />
}
