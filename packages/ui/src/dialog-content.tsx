"use client"

import * as Dialog from "@radix-ui/react-dialog"
import * as React from "react"

type DialogContentProps = React.ComponentPropsWithoutRef<typeof Dialog.Content>

/**
 * DialogContent wraps Radix Dialog.Content and forwards the ref.
 */
export const DialogContent = React.forwardRef<
  React.ElementRef<typeof Dialog.Content>,
  DialogContentProps
>(function DialogContent(
  props: DialogContentProps,
  ref: React.Ref<React.ElementRef<typeof Dialog.Content>>,
): React.JSX.Element {
  return <Dialog.Content ref={ref} {...props} />
})
