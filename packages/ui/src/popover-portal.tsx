"use client"

import * as Popover from "@radix-ui/react-popover"
import type * as React from "react"

type PopoverPortalProps = React.ComponentPropsWithoutRef<typeof Popover.Portal>

/**
 * PopoverPortal wraps Radix Popover.Portal.
 */
export const PopoverPortal = function PopoverPortal(props: PopoverPortalProps): React.JSX.Element {
  return <Popover.Portal {...props} />
}
