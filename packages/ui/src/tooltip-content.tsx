"use client"

import * as Tooltip from "@radix-ui/react-tooltip"
import * as React from "react"

type TooltipContentProps = React.ComponentPropsWithoutRef<typeof Tooltip.Content>

/**
 * TooltipContent wraps Radix Tooltip.Content and forwards the ref.
 */
export const TooltipContent = React.forwardRef<
  React.ElementRef<typeof Tooltip.Content>,
  TooltipContentProps
>(function TooltipContent(
  props: TooltipContentProps,
  ref: React.Ref<React.ElementRef<typeof Tooltip.Content>>,
): React.JSX.Element {
  return <Tooltip.Content ref={ref} {...props} />
})
