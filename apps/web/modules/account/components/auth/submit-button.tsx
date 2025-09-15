"use client"

import { Loader2 } from "lucide-react"
import type React from "react"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"

export function SubmitButton({
  children,
  className,
  variant,
  ...props
}: Omit<React.ComponentProps<typeof Button>, "type" | "disabled">) {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" variant={variant} className={className} disabled={pending} {...props}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </Button>
  )
}
