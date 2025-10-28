"use client"

import * as Dialog from "@radix-ui/react-dialog"
import * as React from "react"

type DialogCloseProps = React.ComponentPropsWithoutRef<typeof Dialog.Close>

/**
 * DialogClose wraps Radix Dialog.Close and forwards the ref.
 */
export const DialogClose = React.forwardRef<
  React.ElementRef<typeof Dialog.Close>,
  DialogCloseProps
>(function DialogClose(
  { children, ...props }: DialogCloseProps,
  ref: React.Ref<React.ElementRef<typeof Dialog.Close>>,
): React.JSX.Element {
  return (
    <Dialog.Close ref={ref} {...props}>
      {children}
    </Dialog.Close>
  )
})
