"use client"

import type { JSX } from "react"
import { useEffect } from "react"

/**
 * Tiny client component to ensure a client reference manifest is emitted for the `(shop)` page.
 * It renders nothing and has zero runtime cost beyond a micro effect in development.
 */
export function ClientProbe(): JSX.Element | null {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.debug("[ClientProbe] mounted")
    }
  }, [])
  return null
}
