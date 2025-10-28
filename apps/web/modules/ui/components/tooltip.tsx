"use client"
import { TooltipContent as UITooltipContent } from "@repo/ui/tooltip-content"
import { TooltipProvider as UITooltipProvider } from "@repo/ui/tooltip-provider"
import { TooltipRoot as UITooltipRoot } from "@repo/ui/tooltip-root"
import { TooltipTrigger as UITooltipTrigger } from "@repo/ui/tooltip-trigger"
import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Tooltip Provider wrapper.
 */
function TooltipProvider({
  delayDuration = 0,
  children,
  ...props
}: React.ComponentProps<typeof UITooltipProvider>): React.JSX.Element {
  return (
    <UITooltipProvider data-slot="tooltip-provider" delayDuration={delayDuration} {...props}>
      {children}
    </UITooltipProvider>
  )
}

/**
 * Tooltip Root wrapper. Renders children into Radix Root.
 */
function Tooltip({
  children,
  ...props
}: React.ComponentProps<typeof UITooltipRoot>): React.JSX.Element {
  return (
    <TooltipProvider>
      <UITooltipRoot data-slot="tooltip" {...props}>
        {children}
      </UITooltipRoot>
    </TooltipProvider>
  )
}

/**
 * Tooltip Trigger. Forwards ref and supports asChild.
 */
const TooltipTrigger = React.forwardRef<
  React.ElementRef<typeof UITooltipTrigger>,
  React.ComponentProps<typeof UITooltipTrigger>
>(({ children, ...props }, ref): React.JSX.Element => {
  return (
    <UITooltipTrigger ref={ref} data-slot="tooltip-trigger" {...props}>
      {children}
    </UITooltipTrigger>
  )
})
TooltipTrigger.displayName = "UITooltipTrigger"

/**
 * Tooltip Content. Forwards ref to content element.
 */
const TooltipContent = React.forwardRef<
  React.ElementRef<typeof UITooltipContent>,
  React.ComponentProps<typeof UITooltipContent>
>(({ className, sideOffset = 0, children, ...props }, ref): React.JSX.Element => {
  return (
    <UITooltipContent
      ref={ref}
      data-slot="tooltip-content"
      sideOffset={sideOffset}
      className={cn(
        "bg-primary text-primary-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-fit origin-(--radix-tooltip-content-transform-origin) rounded-md px-3 py-1.5 text-xs text-balance",
        className,
      )}
      {...props}
    >
      {children}
      {/* Decorative arrow to avoid Radix Popper context mismatch when using UI-wrapped content */}
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-1 left-1/2 z-50 block size-2.5 -translate-x-1/2 rotate-45 rounded-[2px] bg-primary"
      />
    </UITooltipContent>
  )
})
TooltipContent.displayName = "UITooltipContent"

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
