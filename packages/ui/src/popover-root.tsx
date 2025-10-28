"use client"

import * as Popover from "@radix-ui/react-popover"
import type * as React from "react"

type PopoverRootProps = React.ComponentPropsWithoutRef<typeof Popover.Root>

/**
 * PopoverRoot wraps Radix Popover.Root.
 */
export function PopoverRoot(props: PopoverRootProps): React.JSX.Element {
  return <Popover.Root {...props} />
}
