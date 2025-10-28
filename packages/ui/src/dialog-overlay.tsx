"use client"

import * as Dialog from "@radix-ui/react-dialog"
import * as React from "react"

type DialogOverlayProps = React.ComponentPropsWithoutRef<typeof Dialog.Overlay>

/**
 * DialogOverlay wraps Radix Dialog.Overlay and forwards the ref.
 */
export const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof Dialog.Overlay>,
  DialogOverlayProps
>(function DialogOverlay(
  props: DialogOverlayProps,
  ref: React.Ref<React.ElementRef<typeof Dialog.Overlay>>,
): React.JSX.Element {
  return <Dialog.Overlay ref={ref} {...props} />
})
