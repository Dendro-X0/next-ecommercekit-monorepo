"use client"

/**
 * enable2FAAction
 * Frontend-only mock: simulates generating a QR code and backup codes.
 */
interface Enable2FAState {
  readonly success?: boolean
  readonly message?: string
  readonly qrCode?: string
  readonly backupCodes?: readonly string[]
  readonly error?: { readonly message?: string; readonly form?: string }
}

export async function enable2FAAction(
  _prev: Enable2FAState | null,
  formData: FormData,
): Promise<Enable2FAState> {
  const password = String(formData.get("password") ?? "")
  if (password.length < 6) {
    return { error: { form: "Password is required to enable 2FA." } }
  }
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='192' height='192'><rect width='100%' height='100%' fill='white'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-size='12' fill='black'>QR MOCK</text></svg>`
  const codes: readonly string[] = Array.from(
    { length: 8 },
    (_, i) => `CODE-${i + 1}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
  )
  return { success: true, message: "Two-factor setup created.", qrCode: svg, backupCodes: codes }
}
