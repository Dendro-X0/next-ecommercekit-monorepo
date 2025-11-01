import type { JSX } from "react"

export default function Error500(): JSX.Element {
  return (
    <div className="container mx-auto px-4 py-24 text-center">
      <h1 className="text-2xl font-semibold mb-2">Server error</h1>
      <p className="text-muted-foreground mb-6">Please try again later.</p>
    </div>
  )
}
