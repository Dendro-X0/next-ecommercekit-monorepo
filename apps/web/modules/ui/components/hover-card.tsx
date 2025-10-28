"use client"

import * as HoverCardPrimitive from "@radix-ui/react-hover-card"
import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * HoverCard Root wrapper. Groups Trigger and Content and renders children.
 */
function HoverCard({
  children,
  ...props
}: React.ComponentProps<typeof HoverCardPrimitive.Root>): React.JSX.Element {
  return (
    <HoverCardPrimitive.Root data-slot="hover-card" {...props}>
      {children}
    </HoverCardPrimitive.Root>
  )
}

/**
 * HoverCard Trigger. Forwards ref to underlying element and supports asChild.
 */
const HoverCardTrigger = React.forwardRef<
  React.ElementRef<typeof HoverCardPrimitive.Trigger>,
  React.ComponentProps<typeof HoverCardPrimitive.Trigger>
>(({ children, ...props }, ref): React.JSX.Element => {
  return (
    <HoverCardPrimitive.Trigger ref={ref} data-slot="hover-card-trigger" {...props}>
      {children}
    </HoverCardPrimitive.Trigger>
  )
})
HoverCardTrigger.displayName = HoverCardPrimitive.Trigger.displayName

/**
 * HoverCard Content. Forwards ref to content element.
 */
const HoverCardContent = React.forwardRef<
  React.ElementRef<typeof HoverCardPrimitive.Content>,
  React.ComponentProps<typeof HoverCardPrimitive.Content>
>(({ className, align = "center", sideOffset = 4, ...props }, ref): React.JSX.Element => {
  return (
    <HoverCardPrimitive.Portal data-slot="hover-card-portal">
      <HoverCardPrimitive.Content
        ref={ref}
        data-slot="hover-card-content"
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-64 origin-(--radix-hover-card-content-transform-origin) rounded-md border p-4 shadow-md outline-hidden",
          className,
        )}
        {...props}
      />
    </HoverCardPrimitive.Portal>
  )
})
HoverCardContent.displayName = HoverCardPrimitive.Content.displayName

export { HoverCard, HoverCardTrigger, HoverCardContent }
