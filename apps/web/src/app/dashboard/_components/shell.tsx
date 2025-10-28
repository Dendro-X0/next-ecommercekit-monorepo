import type React from "react"
import { SidebarProvider } from "@/components/ui/sidebar"

/**
 * DashboardShell composes the application sidebar with a flexible content area.
 * Keep it minimal and provider-only so pages can opt into additional wrappers.
 */
interface DashboardShellProps {
  readonly children: React.ReactNode
  readonly sidebar: React.ReactNode
  readonly topbar?: React.ReactNode
}

/**
 * Compose a dashboard shell with a sidebar and optional topbar.
 * @param props DashboardShellProps
 * @returns React.ReactElement
 */
export function DashboardShell({
  children,
  sidebar,
  topbar,
}: DashboardShellProps): React.ReactElement {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        {sidebar}
        <div className="flex-1 flex flex-col min-w-0">
          {topbar ? <div className="border-b">{topbar}</div> : null}
          {children}
        </div>
      </div>
    </SidebarProvider>
  )
}
