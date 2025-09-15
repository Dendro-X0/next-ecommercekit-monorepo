import * as React from "react"
import { Resend } from "resend"
import { MagicLinkEmail, VerificationCodeEmail } from "@/components/emails"

interface MagicLinkParams {
  email: string
  url: string
}

export async function sendMagicLinkEmail({ email, url }: MagicLinkParams) {
  try {
    await sendEmail({
      to: email,
      subject: "Your Magic Link",
      react: React.createElement(MagicLinkEmail, { url }),
    })
  } catch (error) {
    console.error(error)
    throw new Error("Failed to send magic link")
  }
}

interface VerificationEmailParams {
  email: string
  url: string
  name: string | null
}

export async function sendVerificationEmail({ email, url }: VerificationEmailParams) {
  try {
    await sendEmail({
      to: email,
      subject: "Verify your email address",
      react: React.createElement(VerificationCodeEmail, { validationCode: url }),
    })
  } catch (error) {
    console.error(error)
    throw new Error("Failed to send verification email")
  }
}

type SendEmailInput = {
  readonly to: string
  readonly subject: string
  readonly react: React.ReactElement
}

async function sendEmail({ to, subject, react }: SendEmailInput): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM || "no-reply@localhost"
  if (!apiKey) {
    console.warn(`[Email] RESEND_API_KEY not set. Would send to ${to} with subject: ${subject}`)
    return
  }
  const resend = new Resend(apiKey)
  await resend.emails.send({ from, to, subject, react })
}
