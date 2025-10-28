"use client"

/**
 * disable2FAAction
 * Frontend-only placeholder: reports disabled action.
 */
interface Disable2FAState {
  readonly success?: boolean
  readonly message?: string
  readonly error?: { readonly message?: string; readonly form?: string }
}

export async function disable2FAAction(
  _prev: Disable2FAState | null,
  _formData: FormData,
): Promise<Disable2FAState> {
  return { success: true, message: "Two-factor disabled (mock)." }
}
