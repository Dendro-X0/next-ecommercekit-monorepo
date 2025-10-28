"use client"

import * as Dialog from "@radix-ui/react-dialog"
import type * as React from "react"

type DialogRootProps = React.ComponentPropsWithoutRef<typeof Dialog.Root>

/**
 * DialogRoot wraps Radix Dialog.Root.
 */
export function DialogRoot(props: DialogRootProps): React.JSX.Element {
  return <Dialog.Root {...props} />
}
