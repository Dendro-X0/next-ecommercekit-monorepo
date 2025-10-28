"use client"

import * as Popover from "@radix-ui/react-popover"
import * as React from "react"

type PopoverCloseProps = React.ComponentPropsWithoutRef<typeof Popover.Close>

/**
 * PopoverClose wraps Radix Popover.Close and forwards the ref.
 */
export const PopoverClose = React.forwardRef<
  React.ElementRef<typeof Popover.Close>,
  PopoverCloseProps
>(function PopoverClose(
  { children, ...props }: PopoverCloseProps,
  ref: React.Ref<React.ElementRef<typeof Popover.Close>>,
): React.JSX.Element {
  return (
    <Popover.Close ref={ref} {...props}>
      {children}
    </Popover.Close>
  )
})
