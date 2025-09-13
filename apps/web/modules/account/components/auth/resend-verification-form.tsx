"use client"

import { useActionState, type ReactElement } from "react"
import { useFormStatus } from "react-dom"
import { Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { ResendVerificationByEmailState } from "@/actions/user/resend-verification-by-email"
import { resendVerificationByEmailAction } from "@/actions/user/resend-verification-by-email"

/**
 * Minimal form to resend an email verification link.
 * Appears under the login form. Works even if the user is not signed in.
 */
export function ResendVerificationForm(): ReactElement {
  const [state, action] = useActionState<ResendVerificationByEmailState, FormData>(
    resendVerificationByEmailAction,
    {},
  )

  return (
    <div className="mt-6 border-t pt-6">
      <h3 className="text-sm font-medium">Didn't receive the verification email?</h3>
      <p className="text-xs text-muted-foreground mb-3">
        Enter your email address and we'll send a new verification link.
      </p>
      <form action={action} className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="resend_email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="resend_email"
              name="resend_email"
              type="email"
              placeholder="you@example.com"
              className="pl-10"
              autoComplete="username"
              required
            />
          </div>
        </div>
        {state?.error && (
          <p className="text-xs text-destructive" role="alert">{state.error}</p>
        )}
        {state?.success && (
          <p className="text-xs text-emerald-600" role="status">{state.success}</p>
        )}
        <div className="flex justify-end">
          <SubmitButton />
        </div>
      </form>
    </div>
  )
}

function SubmitButton(): ReactElement {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" size="sm" disabled={pending} aria-label="Resend verification email">
      {pending ? "Sending..." : "Resend verification"}
    </Button>
  )
}
