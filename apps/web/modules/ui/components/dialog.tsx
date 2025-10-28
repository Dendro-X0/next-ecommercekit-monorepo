"use client"

import { DialogClose as UIDialogClose } from "@repo/ui/dialog-close"
import { DialogContent as UIDialogContent } from "@repo/ui/dialog-content"
import { DialogDescription as UIDialogDescription } from "@repo/ui/dialog-description"
import { DialogOverlay as UIDialogOverlay } from "@repo/ui/dialog-overlay"
import { DialogPortal } from "@repo/ui/dialog-portal"
import { DialogRoot } from "@repo/ui/dialog-root"
import { DialogTitle as UIDialogTitle } from "@repo/ui/dialog-title"
import { DialogTrigger as UIDialogTrigger } from "@repo/ui/dialog-trigger"
import { X as XIcon } from "lucide-react"
import type * as React from "react"

import { cn } from "@/lib/utils"

function Dialog({ children, ...props }: React.ComponentProps<typeof DialogRoot>) {
  return (
    <DialogRoot data-slot="dialog" {...props}>
      {children}
    </DialogRoot>
  )
}

// re-exports moved to bottom to avoid duplicate identifiers

function DialogOverlay({ className, ...props }: React.ComponentProps<typeof UIDialogOverlay>) {
  return (
    <UIDialogOverlay
      data-slot="dialog-overlay"
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
        className,
      )}
      {...props}
    />
  )
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof UIDialogContent> & {
  showCloseButton?: boolean
}) {
  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <UIDialogContent
        data-slot="dialog-content"
        className={cn(
          "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg",
          className,
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <UIDialogClose
            data-slot="dialog-close"
            className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
          >
            <XIcon />
            <span className="sr-only">Close</span>
          </UIDialogClose>
        )}
      </UIDialogContent>
    </DialogPortal>
  )
}

function DialogHeader({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
      {...props}
    >
      {children}
    </div>
  )
}

function DialogFooter({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)}
      {...props}
    >
      {children}
    </div>
  )
}

function DialogTitle({
  className,
  children,
  ...props
}: React.ComponentProps<typeof UIDialogTitle>) {
  return (
    <UIDialogTitle
      data-slot="dialog-title"
      className={cn("text-lg leading-none font-semibold", className)}
      {...props}
    >
      {children}
    </UIDialogTitle>
  )
}

function DialogDescription({
  className,
  children,
  ...props
}: React.ComponentProps<typeof UIDialogDescription>) {
  return (
    <UIDialogDescription
      data-slot="dialog-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    >
      {children}
    </UIDialogDescription>
  )
}

export {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogTitle,
}
export { UIDialogTrigger as DialogTrigger }
export { DialogPortal }
export { UIDialogClose as DialogClose }
