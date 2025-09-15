import { db } from "@repo/db"
import { authSchema } from "@repo/db/auth-schema"
import { createSmtpEmailService } from "@repo/mail"
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { nextCookies } from "better-auth/next-js"
import { magicLink, twoFactor, username } from "better-auth/plugins"
import { authEnv } from "./env"

/**
 * Better Auth server instance configured for Drizzle + Postgres (Neon).
 * - Exposes a single export `auth`.
 * - Cookie strategy switches based on env flags.
 */
// Configure mailer (SMTP for local testing via MailHog/Mailpit). Falls back to console logs.
type Mailer = {
  readonly sendVerificationEmail: (p: {
    readonly email: string
    readonly url: string
  }) => Promise<void>
  readonly sendResetPassword: (p: { readonly email: string; readonly url: string }) => Promise<void>
  readonly sendMagicLink: (p: { readonly email: string; readonly url: string }) => Promise<void>
}

const mailer: Mailer | null = (() => {
  if (
    authEnv.MAIL_PROVIDER === "SMTP" &&
    authEnv.SMTP_HOST &&
    authEnv.SMTP_PORT &&
    authEnv.EMAIL_FROM
  ) {
    return createSmtpEmailService({
      host: authEnv.SMTP_HOST,
      port: authEnv.SMTP_PORT,
      secure: Boolean(authEnv.SMTP_SECURE),
      user: authEnv.SMTP_USER,
      pass: authEnv.SMTP_PASS,
      from: authEnv.EMAIL_FROM,
    })
  }
  return null
})()

/**
 * Compute canonical app URL and trusted origins to satisfy Better Auth redirect validation.
 * In dev we allow common localhost variants to avoid 403 Invalid redirectURL.
 */
const appUrl: string = (() => {
  const raw: string = (authEnv.APP_URL ?? authEnv.NEXT_PUBLIC_APP_URL ?? "").trim()
  return raw.endsWith("/") ? raw.slice(0, -1) : raw
})()

const isProd: boolean = process.env.NODE_ENV === "production"
const defaultDevOrigins: readonly string[] = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
] as const

const trustedOrigins: string[] = Array.from(
  new Set<string>([...(appUrl ? [appUrl] : []), ...(!isProd ? defaultDevOrigins : [])]),
)

/**
 * Conditionally configure social login providers with strict typing.
 */
type GoogleProviderConfig = {
  readonly clientId: string
  readonly clientSecret: string
  readonly redirectUri?: string
}
type GitHubProviderConfig = {
  readonly clientId: string
  readonly clientSecret: string
  readonly redirectUri?: string
}
const socialProviders = {
  ...(authEnv.GOOGLE_CLIENT_ID && authEnv.GOOGLE_CLIENT_SECRET
    ? ({
        google: { clientId: authEnv.GOOGLE_CLIENT_ID, clientSecret: authEnv.GOOGLE_CLIENT_SECRET },
      } as const)
    : {}),
  ...(authEnv.GITHUB_CLIENT_ID && authEnv.GITHUB_CLIENT_SECRET
    ? ({
        github: { clientId: authEnv.GITHUB_CLIENT_ID, clientSecret: authEnv.GITHUB_CLIENT_SECRET },
      } as const)
    : {}),
} satisfies Partial<{ google: GoogleProviderConfig; github: GitHubProviderConfig }>

export const auth = betterAuth({
  // Ensure server knows its base URL for building and validating absolute redirects
  baseURL: appUrl || undefined,
  // Only allow redirects/requests from trusted origins
  trustedOrigins,
  secret: authEnv.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, { provider: "pg", schema: authSchema }),
  advanced: {
    ...(authEnv.ENABLE_CROSS_SUBDOMAIN_COOKIES ? { crossSubDomainCookies: { enabled: true } } : {}),
    ...(() => {
      const useCrossSite =
        !authEnv.ENABLE_CROSS_SUBDOMAIN_COOKIES && authEnv.ENABLE_CROSS_SITE_COOKIES
      if (!useCrossSite) return {}
      const isHttps = appUrl?.startsWith("https://") ?? false
      if (!isHttps && process.env.NODE_ENV !== "production") {
        // In dev over http://localhost, Secure cookies are dropped by the browser.
        // Fall back to lax, non-secure cookies so sign-in works locally.
        // eslint-disable-next-line no-console
        console.warn(
          "[auth] ENABLE_CROSS_SITE_COOKIES=true but APP_URL is not https. Falling back to sameSite=lax, secure=false for dev.",
        )
        return { defaultCookieAttributes: { sameSite: "lax", secure: false } as const }
      }
      return {
        defaultCookieAttributes: { sameSite: "none", secure: true, partitioned: true } as const,
      }
    })(),
  },
  // Start with email/password; OAuth, magic link, passkeys can be added later.
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    // Require users to verify their email before signing in
    requireEmailVerification: true,
    // Send password reset email
    sendResetPassword: async ({ user, url }): Promise<void> => {
      if (mailer) {
        try {
          await mailer.sendResetPassword({ email: user.email, url })
        } catch (err) {
          console.warn(`[ResetPassword] Failed SMTP send to ${user.email}: ${url}`, err)
        }
        return
      }
      console.warn(`[ResetPassword] Send to ${user.email}: ${url}`)
    },
    // Optional hook and security hardening
    onPasswordReset: async ({ user }): Promise<void> => {
      console.info(`[ResetPassword] Password changed for ${user.id}`)
    },
    revokeSessionsOnPasswordReset: true,
  },
  // Email verification
  emailVerification: {
    // Improve resilience and UX: resend on sign-in if not verified,
    // and automatically sign the user in after successful verification.
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }): Promise<void> => {
      if (mailer) {
        try {
          await mailer.sendVerificationEmail({ email: user.email, url })
        } catch (err) {
          console.warn(`[VerifyEmail] Failed SMTP send to ${user.email}: ${url}`, err)
        }
        return
      }
      console.warn(`[VerifyEmail] Send to ${user.email}: ${url}`)
    },
  },
  // Social login (Google/GitHub) if credentials are provided
  ...("google" in socialProviders || "github" in socialProviders ? { socialProviders } : {}),
  plugins: [
    nextCookies(),
    username({
      minUsernameLength: 3,
      maxUsernameLength: 30,
      usernameNormalization: (s) => s.toLowerCase(),
      usernameValidator: (s) => /^[a-zA-Z0-9._-]{3,30}$/.test(s),
      displayUsernameValidator: (s) => /^[a-zA-Z0-9._-]{3,30}$/.test(s),
    }),
    twoFactor(),
    magicLink({
      // Send magic link email
      sendMagicLink: async ({ email, url }) => {
        if (mailer) {
          try {
            await mailer.sendMagicLink({ email, url })
          } catch (err) {
            console.warn(`[MagicLink] Failed SMTP send to ${email}: ${url}`, err)
          }
          return
        }
        console.warn(`[MagicLink] Send to ${email}: ${url}`)
      },
    }),
  ],
})
