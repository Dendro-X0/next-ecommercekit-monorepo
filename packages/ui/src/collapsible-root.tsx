"use client"

import * as CollapsiblePrimitive from "@radix-ui/react-collapsible"
import * as React from "react"

type CollapsibleRootProps = React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Root>

/**
 * CollapsibleRoot wraps Radix Collapsible.Root and forwards ref.
 */
export const CollapsibleRoot = React.forwardRef<
  React.ElementRef<typeof CollapsiblePrimitive.Root>,
  CollapsibleRootProps
>(function CollapsibleRoot(
  props: CollapsibleRootProps,
  ref: React.Ref<React.ElementRef<typeof CollapsiblePrimitive.Root>>,
): React.JSX.Element {
  return <CollapsiblePrimitive.Root ref={ref} {...props} />
})
