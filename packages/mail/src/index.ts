import nodemailer from "nodemailer"

/**
 * Configuration for SMTP transport.
 */
interface SmtpConfig {
  readonly host: string
  readonly port: number
  readonly secure: boolean
  readonly user?: string
  readonly pass?: string
  readonly from: string
}

/**
 * Minimal email service used by the auth package.
 */
interface EmailService {
  /** Send email verification link */
  sendVerificationEmail(params: { readonly email: string; readonly url: string }): Promise<void>
  /** Send password reset link */
  sendResetPassword(params: { readonly email: string; readonly url: string }): Promise<void>
  /** Send magic link sign-in */
  sendMagicLink(params: { readonly email: string; readonly url: string }): Promise<void>
}

const SUBJECTS = {
  verify: "Verify your email",
  reset: "Reset your password",
  magic: "Your sign-in link",
} as const

/**
 * Create an SMTP-backed EmailService. Works well with MailHog/Mailpit in development.
 *
 * - When `user`/`pass` are omitted, it will connect without auth (e.g., MailHog default).
 */
export function createSmtpEmailService(config: SmtpConfig): EmailService {
  const auth = config.user && config.pass ? { user: config.user, pass: config.pass } : undefined
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: Boolean(config.secure),
    auth,
  })

  const send = async (to: string, subject: string, url: string): Promise<void> => {
    const text = `${subject}: ${url}`
    const html = `<p>${subject}</p><p><a href="${url}">${url}</a></p>`
    await transporter.sendMail({ from: config.from, to, subject, text, html })
  }

  return {
    async sendVerificationEmail({ email, url }): Promise<void> {
      await send(email, SUBJECTS.verify, url)
    },
    async sendResetPassword({ email, url }): Promise<void> {
      await send(email, SUBJECTS.reset, url)
    },
    async sendMagicLink({ email, url }): Promise<void> {
      await send(email, SUBJECTS.magic, url)
    },
  }
}
