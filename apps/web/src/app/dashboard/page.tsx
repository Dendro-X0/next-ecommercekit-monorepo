import { getServerSession } from "modules/shared/lib/auth/get-server-session"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { hasRole, type Role } from "@/lib/roles"

/**
 * Dashboard dispatcher:
 * - Redirects to /dashboard/admin if user has admin role or email is in ADMIN_EMAILS.
 * - Redirects to /dashboard/user otherwise.
 */
export default async function DashboardPage(): Promise<never> {
    const h = await headers()
    const session = await getServerSession({ headers: h })
    const user = session?.user

    if (!user) {
        redirect("/auth/login")
    }

    const adminEmailsRaw: string = process.env.ADMIN_EMAILS ?? ""
    const byEmail: boolean =
        typeof user.email === "string" &&
        adminEmailsRaw
            .split(",")
            .map((s) => s.trim().toLowerCase())
            .filter((s) => s.length > 0)
            .includes(user.email.toLowerCase())

    const roles = user.roles as readonly Role[] | undefined
    const byRole: boolean = hasRole(roles, ["admin"]) === true

    if (byRole || byEmail) {
        redirect("/dashboard/admin")
    }

    redirect("/dashboard/user")
}
