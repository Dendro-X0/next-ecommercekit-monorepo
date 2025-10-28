"use client"

import * as Tooltip from "@radix-ui/react-tooltip"
import type * as React from "react"

type TooltipProviderProps = React.ComponentPropsWithoutRef<typeof Tooltip.Provider>

/**
 * TooltipProvider wraps Radix Tooltip.Provider.
 */
export function TooltipProvider(props: TooltipProviderProps): React.JSX.Element {
  return <Tooltip.Provider {...props} />
}
