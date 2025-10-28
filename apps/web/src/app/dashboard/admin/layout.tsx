import { getServerSession } from "modules/shared/lib/auth/get-server-session"
import type { Metadata } from "next"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import type React from "react"
import { Toaster } from "sonner"
import { DashboardShell } from "@/app/dashboard/_components/shell"
import { AdminSidebar } from "@/app/dashboard/admin/_components/admin-sidebar"
import { DashboardHeader } from "@/app/dashboard/user/_components/dashboard-header"
import { ThemeProvider } from "@/components/theme/theme-provider"
import { hasRole, type Role } from "@/lib/roles"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}): Promise<React.ReactElement> {
  const h = await headers()
  const session = await getServerSession({ headers: h })
  const user = session?.user
  if (!user) redirect("/auth/login")
  const roles = user.roles as readonly Role[] | undefined
  const adminEmailsRaw: string = process.env.ADMIN_EMAILS ?? ""
  const byEmail: boolean =
    typeof user.email === "string" &&
    adminEmailsRaw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter((s) => s.length > 0)
      .includes(user.email.toLowerCase())
  const byRole: boolean = hasRole(roles, ["admin"]) === true
  if (!(byRole || byEmail)) redirect("/dashboard/user")
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <DashboardShell sidebar={<AdminSidebar />} topbar={<DashboardHeader title="Admin" />}>
        {children}
      </DashboardShell>
      <Toaster position="top-center" richColors />
    </ThemeProvider>
  )
}

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description:
    "Administrative overview: analytics, reports, orders, marketing, and customer management.",
}
