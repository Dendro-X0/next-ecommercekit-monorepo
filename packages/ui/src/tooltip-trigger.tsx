"use client"

import * as Tooltip from "@radix-ui/react-tooltip"
import * as React from "react"

type TooltipTriggerProps = Omit<
  React.ComponentPropsWithoutRef<typeof Tooltip.Trigger>,
  "asChild"
> & {
  readonly children: React.ReactElement
}

/**
 * TooltipTrigger wraps Radix Tooltip.Trigger using asChild for composition.
 */
export const TooltipTrigger = React.forwardRef<
  React.ElementRef<typeof Tooltip.Trigger>,
  TooltipTriggerProps
>(function TooltipTrigger(
  { children, ...props }: TooltipTriggerProps,
  ref: React.Ref<React.ElementRef<typeof Tooltip.Trigger>>,
): React.JSX.Element {
  return (
    <Tooltip.Trigger ref={ref} asChild data-slot="tooltip-trigger" {...props}>
      {children}
    </Tooltip.Trigger>
  )
})
