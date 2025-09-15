/**
 * Typed helpers around Better Auth client plugin methods used in the web app.
 * Centralizes narrow casts so callsites remain clean and type-safe.
 */

import { authClient } from "@/lib/auth-client"

/** A minimal API error shape used across helpers. */
type ApiError = Readonly<{ message?: string }>

/** Generic result envelope used by helpers. */
type Result<T> = Readonly<{ data?: T; error?: ApiError }>

/** Username availability payload. */
type UsernameAvailability = Readonly<{ available: boolean }>

/** Two-factor verify payload. */
type VerifyTotpInput = Readonly<{ code: string; trustDevice?: boolean }>

/** Sign-in with email + password. */
function signInEmail(
  args: Readonly<{ email: string; password: string }>,
): Promise<Result<unknown>> {
  const fn = (
    authClient.signIn as unknown as {
      readonly email: (a: { email: string; password: string }) => Promise<Result<unknown>>
    }
  ).email
  return fn({ email: args.email, password: args.password })
}

/** Sign-in with username + password. */
function signInUsername(
  args: Readonly<{ username: string; password: string }>,
): Promise<Result<unknown>> {
  const fn = (
    authClient.signIn as unknown as {
      readonly username: (a: { username: string; password: string }) => Promise<Result<unknown>>
    }
  ).username
  return fn({ username: args.username, password: args.password })
}

/** Send magic link. */
function signInMagicLink(
  args: Readonly<{ email: string; callbackURL?: string }>,
): Promise<Result<unknown>> {
  const fn = (
    authClient.signIn as unknown as {
      readonly magicLink: (a: { email: string; callbackURL?: string }) => Promise<Result<unknown>>
    }
  ).magicLink
  return fn({ email: args.email, callbackURL: args.callbackURL })
}

/** Check if username is available. */
function isUsernameAvailable(
  args: Readonly<{ username: string }>,
): Promise<Result<UsernameAvailability>> {
  const fn = (
    authClient as unknown as {
      readonly isUsernameAvailable: (a: {
        username: string
      }) => Promise<Result<UsernameAvailability>>
    }
  ).isUsernameAvailable
  return fn({ username: args.username })
}

/** Sign-up via email, including optional username. */
function signUpEmail(
  args: Readonly<{ name?: string; email: string; username?: string; password: string }>,
): Promise<Result<unknown>> {
  const fn = (
    authClient.signUp as unknown as {
      readonly email: (a: {
        name?: string
        email: string
        username?: string
        password: string
      }) => Promise<Result<unknown>>
    }
  ).email
  return fn({
    name: args.name,
    email: args.email,
    username: args.username,
    password: args.password,
  })
}

/** Update user profile fields accepted by the app (name/username). */
function updateUserProfile(
  args: Readonly<{ name?: string; username?: string }>,
): Promise<Result<unknown>> {
  const fn = (
    authClient as unknown as {
      readonly updateUser: (a: { name?: string; username?: string }) => Promise<Result<unknown>>
    }
  ).updateUser
  return fn({ name: args.name, username: args.username })
}

/** Enable TOTP 2FA. */
function twoFactorEnable(args: Readonly<{ password: string }>): Promise<Result<unknown>> {
  const fn = (
    authClient as unknown as {
      readonly twoFactor: { readonly enable: (a: { password: string }) => Promise<Result<unknown>> }
    }
  ).twoFactor.enable
  return fn({ password: args.password })
}

/** Disable TOTP 2FA. */
function twoFactorDisable(args: Readonly<{ password: string }>): Promise<Result<unknown>> {
  const fn = (
    authClient as unknown as {
      readonly twoFactor: {
        readonly disable: (a: { password: string }) => Promise<Result<unknown>>
      }
    }
  ).twoFactor.disable
  return fn({ password: args.password })
}

/** Verify TOTP code. */
function twoFactorVerifyTotp(args: VerifyTotpInput): Promise<Result<unknown>> {
  const fn = (
    authClient as unknown as {
      readonly twoFactor: {
        readonly verifyTotp: (a: VerifyTotpInput) => Promise<Result<unknown>>
      }
    }
  ).twoFactor.verifyTotp
  return fn({ code: args.code, trustDevice: args.trustDevice })
}

/** Generate 2FA backup codes. */
function twoFactorGenerateBackupCodes(
  args: Readonly<{ password: string }>,
): Promise<Result<readonly string[] | null>> {
  const fn = (
    authClient as unknown as {
      readonly twoFactor: {
        readonly generateBackupCodes: (a: {
          password: string
        }) => Promise<Result<readonly string[] | null>>
      }
    }
  ).twoFactor.generateBackupCodes
  return fn({ password: args.password })
}

/**
 * Single exported helpers object to comply with project export conventions.
 */
export const authClientHelpers = {
  signInEmail,
  signInUsername,
  signInMagicLink,
  isUsernameAvailable,
  signUpEmail,
  updateUserProfile,
  twoFactorEnable,
  twoFactorDisable,
  twoFactorVerifyTotp,
  twoFactorGenerateBackupCodes,
}
