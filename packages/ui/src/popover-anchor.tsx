"use client"

import * as Popover from "@radix-ui/react-popover"
import * as React from "react"

type PopoverAnchorProps = React.ComponentPropsWithoutRef<typeof Popover.Anchor>

/**
 * PopoverAnchor wraps Radix Popover.Anchor and forwards the ref.
 */
export const PopoverAnchor = React.forwardRef<
  React.ElementRef<typeof Popover.Anchor>,
  PopoverAnchorProps
>(function PopoverAnchor(
  props: PopoverAnchorProps,
  ref: React.Ref<React.ElementRef<typeof Popover.Anchor>>,
): React.JSX.Element {
  return <Popover.Anchor ref={ref} {...props} />
})
