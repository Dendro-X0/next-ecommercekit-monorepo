"use client"

import { PopoverAnchor } from "@repo/ui/popover-anchor"
import { PopoverContent as UIPopoverContent } from "@repo/ui/popover-content"
import { PopoverPortal } from "@repo/ui/popover-portal"
import { PopoverRoot } from "@repo/ui/popover-root"
import { PopoverTrigger as UIPopoverTrigger } from "@repo/ui/popover-trigger"
import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Popover Root wrapper.
 * Renders Radix PopoverPrimitive.Root and passes children through.
 * Use for grouping PopoverTrigger and PopoverContent.
 */
function Popover({
  children,
  ...props
}: React.ComponentProps<typeof PopoverRoot>): React.JSX.Element {
  return (
    <PopoverRoot data-slot="popover" {...props}>
      {children}
    </PopoverRoot>
  )
}

/**
 * Popover Trigger.
 * Forwards its ref to the underlying trigger element.
 * Supports asChild composition for custom trigger elements.
 */
export { UIPopoverTrigger as PopoverTrigger }

/**
 * Popover Content.
 * Forwards ref to the content element for imperative focus/measure.
 */
const PopoverContent = React.forwardRef<
  React.ElementRef<typeof UIPopoverContent>,
  React.ComponentProps<typeof UIPopoverContent>
>(({ className, align = "center", sideOffset = 4, ...props }, ref): React.JSX.Element => {
  return (
    <PopoverPortal>
      <UIPopoverContent
        ref={ref}
        data-slot="popover-content"
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-72 origin-(--radix-popover-content-transform-origin) rounded-md border p-4 shadow-md outline-hidden",
          className,
        )}
        {...props}
      />
    </PopoverPortal>
  )
})
PopoverContent.displayName = "UIPopoverContent"

/**
 * Popover Anchor.
 * Optional anchor element used to position the popover.
 */
export { PopoverAnchor }

export { Popover, PopoverContent }
