/**
 * Dashboard segment loading UI to smooth transitions after sign-in.
 */
import type { ReactElement } from "react"
import { Spinner } from "@/components/ui/spinner"

export default function DashboardLoading(): ReactElement {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="flex items-center gap-3 text-muted-foreground">
        <Spinner size={18} />
        <span>Loading your dashboard...</span>
      </div>
    </div>
  )
}
