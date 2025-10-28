"use client"

import * as CollapsiblePrimitive from "@radix-ui/react-collapsible"
import * as React from "react"

type CollapsibleTriggerProps = Omit<
  React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Trigger>,
  "asChild"
> & {
  readonly children: React.ReactElement
}

/**
 * CollapsibleTrigger wraps Radix Collapsible.Trigger with asChild composition.
 * Enforces a single ReactElement child and forwards the ref.
 */
export const CollapsibleTrigger = React.forwardRef<
  React.ElementRef<typeof CollapsiblePrimitive.Trigger>,
  CollapsibleTriggerProps
>(function CollapsibleTrigger(
  { children, ...props }: CollapsibleTriggerProps,
  ref: React.Ref<React.ElementRef<typeof CollapsiblePrimitive.Trigger>>,
): React.JSX.Element {
  return (
    <CollapsiblePrimitive.Trigger ref={ref} asChild data-slot="collapsible-trigger" {...props}>
      {children}
    </CollapsiblePrimitive.Trigger>
  )
})
