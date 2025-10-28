/**
 * Global 404 page.
 */
import type { ReactElement } from "react"
import { AppLink } from "../../modules/shared/components/app-link"

export default function NotFound(): ReactElement {
  return (
    <div className="min-h-screen grid place-items-center bg-muted/50 p-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">Page not found</h1>
        <p className="text-muted-foreground mb-4">The page you requested doesn’t exist.</p>
        <AppLink
          href="/"
          className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-primary-foreground hover:opacity-90 transition"
        >
          Go home
        </AppLink>
      </div>
    </div>
  )
}
