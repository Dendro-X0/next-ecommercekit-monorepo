"use client"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@components/ui/sidebar"
import type * as React from "react"
import { useSession } from "@/hooks/use-session"
import { navMain, navProjects, teams } from "@/lib/admin-data"
import { NavMain } from "./nav-main"
import { NavProjects } from "./nav-projects"
import { NavUser } from "./nav-user"
import { TeamSwitcher } from "./team-switcher"

export function AdminSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const session = useSession()
  const u = session?.user
  const name: string =
    u?.name && String(u.name).length > 0 ? String(u.name) : String(u?.email ?? "Admin")
  const email: string = String(u?.email ?? "")
  const avatar: string = (u?.image as string | undefined) ?? ""
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        <NavProjects projects={navProjects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={{ name, email, avatar }} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
