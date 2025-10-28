"use client"

import * as Popover from "@radix-ui/react-popover"
import * as React from "react"

type PopoverTriggerProps = Omit<React.ComponentPropsWithoutRef<typeof Popover.Trigger>, "asChild">

/**
 * PopoverTrigger wraps Radix Popover.Trigger using asChild for composition.
 */
export const PopoverTrigger = React.forwardRef<
  React.ElementRef<typeof Popover.Trigger>,
  PopoverTriggerProps
>(function PopoverTrigger(
  { children, ...props }: PopoverTriggerProps,
  ref: React.Ref<React.ElementRef<typeof Popover.Trigger>>,
): React.JSX.Element {
  return (
    <Popover.Trigger ref={ref} asChild data-slot="popover-trigger" {...props}>
      {children}
    </Popover.Trigger>
  )
})
