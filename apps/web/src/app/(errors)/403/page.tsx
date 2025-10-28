import type React from "react"
import { AppLink } from "../../../../modules/shared/components/app-link"

/**
 * 403 - Not Authorized
 * Minimal page shown when a user lacks permission to view a resource.
 */
export default function NotAuthorizedPage(): React.ReactElement {
  return (
    <main className="container mx-auto max-w-2xl p-8 text-center">
      <h1 className="text-3xl font-semibold">403 – Not authorized</h1>
      <p className="mt-4 text-muted-foreground">You do not have access to view this page.</p>
      <div className="mt-6">
        <AppLink href="/" className="underline">
          Go back home
        </AppLink>
      </div>
    </main>
  )
}
