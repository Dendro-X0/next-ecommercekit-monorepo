/**
 * Global app-level loading UI shown during route transitions and initial render.
 */
import type { ReactElement } from "react"
import { Spinner } from "~/modules/ui/components/spinner"

export default function Loading(): ReactElement {
  return (
    <div className="min-h-screen grid place-items-center bg-muted/50 p-4">
      <div className="flex items-center gap-3 text-muted-foreground">
        <Spinner size={20} />
        <span>Loading...</span>
      </div>
    </div>
  )
}
