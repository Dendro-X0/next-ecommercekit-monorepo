import { redirect } from "next/navigation"
import { links } from "@/lib/links"

/**
 * AdminDashboardIndexPage
 * Redirects `/dashboard/admin/dashboard` to the Overview page.
 */
export default function AdminDashboardIndexPage(): never {
  redirect(links.getDashboardAdminDashboardOverviewRoute())
}
