"use client"

import * as Dialog from "@radix-ui/react-dialog"
import * as React from "react"

type DialogDescriptionProps = React.ComponentPropsWithoutRef<typeof Dialog.Description>

/**
 * DialogDescription wraps Radix Dialog.Description and forwards the ref.
 */
export const DialogDescription = React.forwardRef<
  React.ElementRef<typeof Dialog.Description>,
  DialogDescriptionProps
>(function DialogDescription(
  { children, ...props }: DialogDescriptionProps,
  ref: React.Ref<React.ElementRef<typeof Dialog.Description>>,
): React.JSX.Element {
  return (
    <Dialog.Description ref={ref} {...props}>
      {children}
    </Dialog.Description>
  )
})
