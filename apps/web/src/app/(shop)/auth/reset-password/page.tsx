import type { ReactElement } from "react"
import { ResetPasswordForm } from "@/components/auth/reset-password-form"

type ResetSearchParams = { readonly token?: string; readonly error?: string }

/**
 * Reset Password page. Awaits searchParams to satisfy the Next.js 16 dynamic search params API.
 */
export default async function resetPasswordPage(props: {
  readonly searchParams: Promise<ResetSearchParams>
}): Promise<ReactElement> {
  const sp: ResetSearchParams = await props.searchParams
  const token: string = sp?.token ?? ""
  const error: string = sp?.error ?? ""
  if (!token || error) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">Invalid Reset Link</h1>
        <p className="text-muted-foreground">This password reset link is invalid or has expired.</p>
      </div>
    )
  }
  return <ResetPasswordForm token={token} />
}
