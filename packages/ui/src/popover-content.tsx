"use client"

import * as Popover from "@radix-ui/react-popover"
import * as React from "react"

type PopoverContentProps = React.ComponentPropsWithoutRef<typeof Popover.Content>

/**
 * PopoverContent wraps Radix Popover.Content and forwards the ref.
 */
export const PopoverContent = React.forwardRef<
  React.ElementRef<typeof Popover.Content>,
  PopoverContentProps
>(function PopoverContent(
  props: PopoverContentProps,
  ref: React.Ref<React.ElementRef<typeof Popover.Content>>,
): React.JSX.Element {
  return <Popover.Content ref={ref} {...props} />
})
