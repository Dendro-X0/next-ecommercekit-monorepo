"use client"

import * as CollapsiblePrimitive from "@radix-ui/react-collapsible"
import * as React from "react"

type CollapsibleContentProps = Omit<
  React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Content>,
  "asChild"
> & {
  readonly children: React.ReactElement
}

/**
 * CollapsibleContent wraps Radix Collapsible.Content with asChild composition.
 * Enforces a single ReactElement child and forwards the ref.
 */
export const CollapsibleContent = React.forwardRef<
  React.ElementRef<typeof CollapsiblePrimitive.Content>,
  CollapsibleContentProps
>(function CollapsibleContent(
  { children, ...props }: CollapsibleContentProps,
  ref: React.Ref<React.ElementRef<typeof CollapsiblePrimitive.Content>>,
): React.JSX.Element {
  return (
    <CollapsiblePrimitive.Content ref={ref} asChild data-slot="collapsible-content" {...props}>
      {children}
    </CollapsiblePrimitive.Content>
  )
})
