/**
 * Better Auth client configured for the web app.
 * - Sends credentials (cookies) on cross-origin requests
 * - Points to API's /auth endpoint
 * - Infers additional fields from the server auth instance for strong typing
 */
// Removed legacy frontend-only stub; using real Better Auth client below.

import { magicLinkClient, twoFactorClient, usernameClient } from "better-auth/client/plugins"
// Single export per file
import { createAuthClient } from "better-auth/react"

/**
 * Better Auth client for the Next.js frontend.
 * - Uses same-origin `/api/auth` by default (no baseURL needed)
 * - Cookies are handled automatically by the browser on same-origin requests
 */
const client: ReturnType<typeof createAuthClient> = createAuthClient({
  plugins: [
    twoFactorClient({
      onTwoFactorRedirect: (): void => {
        window.location.href = "/auth/two-factor"
      },
    }),
    magicLinkClient(),
    usernameClient(),
  ],
})

/**
 * Public Better Auth client instance for the web app.
 */
export type AuthClient = ReturnType<typeof createAuthClient>
export const authClient: AuthClient = client as AuthClient
