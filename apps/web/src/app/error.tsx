"use client"

import { type ReactElement, useEffect } from "react"
import { Button } from "@/components/ui/button"

/**
 * Route segment error boundary.
 * Do NOT wrap with <html>/<body>; that’s only for app/global-error.tsx.
 */
export default function RouteError({
  error,
  reset,
}: Readonly<{
  error: Error & { digest?: string }
  reset: () => void
}>): ReactElement {
  useEffect(() => {
    console.error("[error.tsx]", {
      message: error.message,
      stack: error.stack,
      digest: error.digest,
    })
  }, [error])

  return (
    <div className="container mx-auto px-4 py-24 text-center">
      <h1 className="text-2xl font-semibold mb-2">Something went wrong</h1>
      <p className="text-muted-foreground mb-6">
        An unexpected error occurred while rendering this page.
      </p>
      <div className="flex items-center justify-center gap-3">
        <Button onClick={() => reset()}>Try again</Button>
        <Button variant="outline" onClick={() => window.location.assign("/")}>
          Go Home
        </Button>
      </div>
      {process.env.NODE_ENV !== "production" && (
        <pre className="mt-6 text-left mx-auto max-w-3xl overflow-auto rounded-md bg-muted p-4 text-xs">
          {error.stack || error.message}
        </pre>
      )}
    </div>
  )
}
