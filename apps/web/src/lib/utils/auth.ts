/**
 * Type guard to check if an error is a Better Auth API error.
 */
export function isAuthError(error: unknown): error is { body: { message: string } } {
  if (typeof error !== "object" || error === null) {
    return false
  }

  const errorObj = error as Record<string, unknown>
  if (!("body" in errorObj) || typeof errorObj.body !== "object" || errorObj.body === null) {
    return false
  }

  const body = errorObj.body as Record<string, unknown>
  return "message" in body && typeof body.message === "string"
}
