"use server"

import { auth } from "@repo/auth"
import { headers } from "next/headers"
import { authClient } from "@/lib/auth-client"

/**
 * Result state for resend verification action.
 */
interface ResendVerificationEmailState {
  readonly success?: boolean
  readonly message?: string
  readonly error?: { readonly message?: string; readonly form?: string }
}

/**
 * Build an absolute callback URL using request headers.
 */
async function buildCallbackUrl(path: string): Promise<string> {
  const hdrs = await headers()
  const host: string = hdrs.get("x-forwarded-host") ?? hdrs.get("host") ?? "localhost:3000"
  const proto: string = hdrs.get("x-forwarded-proto") ?? "http"
  const base: string = `${proto}://${host}`
  return new URL(path, base).toString()
}

/**
 * Sends a verification email for the currently authenticated user.
 * - Reads session via Better Auth server API to get the user's email.
 * - If already verified, returns a friendly message (no-op).
 * - Otherwise calls Better Auth to send a new verification email.
 */
export async function resendVerificationEmailAction(
  _prev: ResendVerificationEmailState | null,
  _formData: FormData,
): Promise<ResendVerificationEmailState> {
  try {
    const hdrs = await headers()
    const session = await auth.api.getSession({ headers: hdrs })
    const user = session?.user as { email?: string; emailVerified?: boolean } | undefined
    const email: string | undefined = user?.email
    if (!email) {
      return { error: { message: "You must be signed in to resend verification email." } }
    }
    if (user?.emailVerified === true) {
      return { success: true, message: "Your email is already verified." }
    }

    const callbackURL: string = await buildCallbackUrl(
      `/auth/login?verified=1&email=${encodeURIComponent(email)}`,
    )

    const { error } = await authClient.sendVerificationEmail({ email, callbackURL })

    if (error) {
      return { error: { message: error.message } }
    }
    return { success: true, message: "Verification email sent. Please check your inbox." }
  } catch (e) {
    const message: string = e instanceof Error ? e.message : "Failed to send verification email."
    return { error: { message } }
  }
}
