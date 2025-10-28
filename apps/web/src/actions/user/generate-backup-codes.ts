"use client"

/**
 * generateBackupCodesAction
 * Frontend-only mock: creates a new set of backup codes.
 */
interface GenerateBackupCodesState {
  readonly success?: boolean
  readonly message?: string
  readonly backupCodes?: readonly string[]
  readonly error?: { readonly message?: string; readonly form?: string }
}

export async function generateBackupCodesAction(
  _prev: GenerateBackupCodesState | null,
  _formData: FormData,
): Promise<GenerateBackupCodesState> {
  const codes: readonly string[] = Array.from(
    { length: 8 },
    (_, i) => `BC-${i + 1}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
  )
  return { success: true, message: "Generated new backup codes.", backupCodes: codes }
}
