"use client"

import * as React from "react"
import { ShoppingCart } from "lucide-react"
import { ThemeToggle } from "@/components/theme/theme-toggle"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useSession } from "@/hooks/use-session"
import { isAdminEmail } from "@/lib/admin-allowlist"
import { hasRole, type Role } from "@/lib/roles"
import { AppLink } from "../../../../../modules/shared/components/app-link"

interface DashboardHeaderProps {
  title: string
  breadcrumbs?: Array<{
    label: string
    href?: string
  }>
}

export function DashboardHeader({ title, breadcrumbs }: DashboardHeaderProps) {
  const session = useSession()
  const roles = session?.user?.roles as readonly Role[] | undefined
  const isAdmin: boolean =
    session?.user?.isAdmin === true ||
    hasRole(roles, ["admin"]) ||
    isAdminEmail(session?.user?.email ?? null)
  return (
    <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 border-b">
      <div className="flex items-center gap-2 px-4 flex-1">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        {breadcrumbs && breadcrumbs.length > 0 ? (
          <Breadcrumb>
            {/* Visually hidden page heading for screen readers when using breadcrumbs */}
            <h1 className="sr-only">{title}</h1>
            <BreadcrumbList>
              {breadcrumbs.map((breadcrumb, index) => (
                <React.Fragment key={`${breadcrumb.label}-${breadcrumb.href ?? "root"}`}>
                  {index > 0 && <BreadcrumbSeparator key={`sep-${breadcrumb.label}`} className="hidden md:block" />}
                  <BreadcrumbItem className={index === 0 ? "hidden md:block" : ""}>
                    {breadcrumb.href ? (
                      <BreadcrumbLink href={breadcrumb.href}>{breadcrumb.label}</BreadcrumbLink>
                    ) : (
                      <BreadcrumbPage>{breadcrumb.label}</BreadcrumbPage>
                    )}
                  </BreadcrumbItem>
                </React.Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        ) : (
          <h1 className="text-lg font-semibold">{title}</h1>
        )}
      </div>

      {/* Top-right navigation */}
      <div className="flex items-center gap-2 px-4">
        {isAdmin && (
          <Button variant="secondary" size="sm" asChild>
            <AppLink href="/dashboard/admin">Admin</AppLink>
          </Button>
        )}
        <Button variant="outline" size="sm" asChild>
          <AppLink href="/" aria-label="Shop Now">
            <ShoppingCart className="mr-2 h-4 w-4" />
            Shop Now
          </AppLink>
        </Button>
        <ThemeToggle />
      </div>
    </header>
  )
}
