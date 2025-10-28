import { z } from "zod"

/**
 * Server-only environment validation for the database package.
 */
export const dbEnv = (() => {
  const schema = z.object({
    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  })
  const parsed = schema.safeParse(process.env)
  if (!parsed.success) {
    const message = parsed.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join("; ")
    throw new Error(`Invalid database environment variables: ${message}`)
  }
  return parsed.data
})()
