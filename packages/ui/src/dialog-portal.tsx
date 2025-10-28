"use client"

import * as Dialog from "@radix-ui/react-dialog"
import type * as React from "react"

type DialogPortalProps = React.ComponentPropsWithoutRef<typeof Dialog.Portal>

/**
 * DialogPortal wraps Radix Dialog.Portal.
 */
export const DialogPortal = function DialogPortal(props: DialogPortalProps): React.JSX.Element {
  return <Dialog.Portal {...props} />
}
