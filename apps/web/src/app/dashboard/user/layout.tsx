import { getServerSession } from "modules/shared/lib/auth/get-server-session"
import type { Metadata } from "next"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import type React from "react"
import { DashboardShell } from "@/app/dashboard/_components/shell"
import { ThemeProvider } from "@/components/theme/theme-provider"
import { UserSidebar } from "./_components/user-sidebar"

/**
 * DashboardLayout: protects the user dashboard server-side and renders the shell.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}): Promise<React.ReactElement> {
  const h = await headers()
  const session = await getServerSession({ headers: h })
  if (!session?.user) redirect("/auth/login")
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <DashboardShell sidebar={<UserSidebar />}>{children}</DashboardShell>
    </ThemeProvider>
  )
}

export const metadata: Metadata = {
  title: "Dashboard",
  description:
    "Your account hub: view orders, spending analytics, membership status, and quick actions.",
}
