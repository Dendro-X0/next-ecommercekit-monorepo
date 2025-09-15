import type { JSX } from "react"
import { AppLink } from "../../../modules/shared/components/app-link"

export default function SafeRoute(): JSX.Element {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold mb-2">Safe Route</h1>
        <p className="text-muted-foreground">
          This route uses the root layout only and avoids the (shop) layout.
        </p>
        <div className="mt-6 flex gap-3 justify-center">
          <AppLink href="/" className="rounded-md border px-4 py-2">
            Home
          </AppLink>
          <AppLink href="/shop" className="rounded-md border px-4 py-2">
            Shop
          </AppLink>
        </div>
      </div>
    </main>
  )
}
