"use client"

import * as Dialog from "@radix-ui/react-dialog"
import * as React from "react"

type DialogTriggerProps = Omit<React.ComponentPropsWithoutRef<typeof Dialog.Trigger>, "asChild"> & {
  readonly children: React.ReactElement
}

/**
 * DialogTrigger wraps Radix Dialog.Trigger using asChild for composition.
 */
export const DialogTrigger = React.forwardRef<
  React.ElementRef<typeof Dialog.Trigger>,
  DialogTriggerProps
>(function DialogTrigger(
  { children, ...props }: DialogTriggerProps,
  ref: React.Ref<React.ElementRef<typeof Dialog.Trigger>>,
): React.JSX.Element {
  return (
    <Dialog.Trigger ref={ref} asChild data-slot="dialog-trigger" {...props}>
      {children}
    </Dialog.Trigger>
  )
})
