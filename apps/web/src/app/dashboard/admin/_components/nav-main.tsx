"use client"

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@components/ui/sidebar"
import { ChevronRight, type LucideIcon } from "lucide-react"
import type React from "react"
import { AppLink } from "../../../../../modules/shared/components/app-link"

/**
 * NavMain renders the main admin sidebar groups.
 * Disabled sub-items are hidden. Groups with no enabled sub-items are omitted.
 */
export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: LucideIcon
    isActive?: boolean
    items?: {
      title: string
      url: string
      disabled?: boolean
    }[]
  }[]
}): React.ReactElement {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>E-commerce Platform</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const subItems = (item.items ?? []).filter((i) => !i.disabled)
          if (subItems.length === 0) return null
          return (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={item.isActive}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton tooltip={item.title}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {subItems.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton asChild>
                          <AppLink href={subItem.url}>
                            <span>{subItem.title}</span>
                          </AppLink>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
