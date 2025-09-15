"use client"

import type { JSX } from "react"
import * as React from "react"
import { Button } from "@/components/ui/button"

export type ConfirmDialogProps = Readonly<{
  open: boolean
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  loading?: boolean
  variant?: "default" | "destructive"
  onConfirm: () => void
  onCancel: () => void
  onOpenChange?: (open: boolean) => void
}>

/**
 * Minimalist, reusable confirmation dialog.
 * Centered modal with overlay. No external UI library required.
 */
export default function ConfirmDialog(props: ConfirmDialogProps): JSX.Element | null {
  const {
    open,
    title,
    description,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    loading = false,
    variant = "default",
    onConfirm,
    onCancel,
    onOpenChange,
  } = props

  React.useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent): void => {
      if (e.key === "Escape") {
        onOpenChange?.(false)
        onCancel()
      }
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [open, onCancel, onOpenChange])

  const onOverlayClick = (): void => {
    onOpenChange?.(false)
    onCancel()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 grid place-items-center">
      {/* Clickable overlay as a real interactive control for a11y */}
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
        onClick={onOverlayClick}
      />
      <div
        className="relative w-full max-w-sm rounded-lg border bg-background p-6 shadow-xl"
        role="dialog"
        aria-modal="true"
      >
        <h2 className="text-lg font-semibold">{title}</h2>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
        <div className="mt-5 flex items-center justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange?.(false)
              onCancel()
            }}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={variant === "destructive" ? "destructive" : "default"}
            onClick={() => {
              onOpenChange?.(false)
              onConfirm()
            }}
            disabled={loading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
