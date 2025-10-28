import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"

// Minimal Better Auth instance for CLI schema generation only.
// Uses Drizzle adapter with Postgres provider. No DB connection required.
export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET || "dev-secret-please-change",
  database: drizzleAdapter({}, { provider: "pg" }),
})
