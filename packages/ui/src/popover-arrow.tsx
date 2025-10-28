"use client"

import * as Popover from "@radix-ui/react-popover"
import * as React from "react"

type PopoverArrowProps = React.ComponentPropsWithoutRef<typeof Popover.Arrow>

/**
 * PopoverArrow wraps Radix Popover.Arrow and forwards the ref.
 */
export const PopoverArrow = React.forwardRef<
  React.ElementRef<typeof Popover.Arrow>,
  PopoverArrowProps
>(function PopoverArrow(
  props: PopoverArrowProps,
  ref: React.Ref<React.ElementRef<typeof Popover.Arrow>>,
): React.JSX.Element {
  return <Popover.Arrow ref={ref} {...props} />
})
