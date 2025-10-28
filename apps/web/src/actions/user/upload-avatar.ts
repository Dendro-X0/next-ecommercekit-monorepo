"use client"

/**
 * uploadAvatarAction
 * Frontend-only placeholder. Returns an error to indicate disabled behavior.
 */
interface UploadAvatarState {
  readonly success?: boolean
  readonly message?: string
  readonly error?: { readonly message?: string; readonly form?: string }
}
/**
 * Uploads an avatar image. Frontend-only mode: always returns disabled error.
 */
export async function uploadAvatarAction(
  _: UploadAvatarState | null,
  formData: FormData,
): Promise<UploadAvatarState> {
  const file = formData.get("avatar")
  const hasFile: boolean = typeof file === "object" && file !== null
  if (!hasFile) {
    return { error: { form: "Please select an image file." } }
  }
  return { error: { form: "Avatar upload is disabled in frontend-only mode." } }
}
