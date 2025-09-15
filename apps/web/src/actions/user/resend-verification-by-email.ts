"use server"

import { auth } from "@repo/auth"
import { headers } from "next/headers"
import { z } from "zod"

export type ResendVerificationByEmailState = Readonly<{
  success?: string
  error?: string
}>

const EmailSchema = z.object({
  email: z.string().email(),
})

async function buildCallbackUrl(path: string): Promise<string> {
  const hdrs = await headers()
  const host: string = hdrs.get("x-forwarded-host") ?? hdrs.get("host") ?? "localhost:3000"
  const proto: string = hdrs.get("x-forwarded-proto") ?? "http"
  const base: string = `${proto}://${host}`
  return new URL(path, base).toString()
}

export async function resendVerificationByEmailAction(
  _prev: ResendVerificationByEmailState | null,
  formData: FormData,
): Promise<ResendVerificationByEmailState> {
  const parsed = EmailSchema.safeParse({ email: String(formData.get("resend_email") ?? "") })
  if (!parsed.success) {
    return { error: "Please enter a valid email address." }
  }
  const { email } = parsed.data

  const callbackURL: string = await buildCallbackUrl(
    `/auth/login?verified=1&email=${encodeURIComponent(email)}`,
  )

  try {
    // Use server-side Better Auth API to send verification
    await auth.api.sendVerificationEmail({ body: { email, callbackURL } })
    return { success: "Verification email sent. Please check your inbox." }
  } catch (e) {
    const message: string = e instanceof Error ? e.message : "Failed to send verification email."
    return { error: message }
  }
}
