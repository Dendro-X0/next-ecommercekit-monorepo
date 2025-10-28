"use client"

import * as Dialog from "@radix-ui/react-dialog"
import * as React from "react"

type DialogTitleProps = React.ComponentPropsWithoutRef<typeof Dialog.Title>

/**
 * DialogTitle wraps Radix Dialog.Title and forwards the ref.
 */
export const DialogTitle = React.forwardRef<
  React.ElementRef<typeof Dialog.Title>,
  DialogTitleProps
>(function DialogTitle(
  { children, ...props }: DialogTitleProps,
  ref: React.Ref<React.ElementRef<typeof Dialog.Title>>,
): React.JSX.Element {
  return (
    <Dialog.Title ref={ref} {...props}>
      {children}
    </Dialog.Title>
  )
})
