import { config as dotenvConfig } from "dotenv"

// Load env from web app first (unified env strategy), then fallback to local .env
dotenvConfig({ path: "../../apps/web/.env.local" })
dotenvConfig()

import { defineConfig } from "drizzle-kit"
import path from "path"

const herePosix = __dirname.replace(/\\/g, "/")
// Use relative out to avoid duplicated absolute path issues on Windows
const outDir = `./drizzle`
const schemaGlob = `${herePosix}/src/schema/*.ts`

export default defineConfig({
  dialect: "postgresql",
  out: outDir,
  schema: [schemaGlob],
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
})
