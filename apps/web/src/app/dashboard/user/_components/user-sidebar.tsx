"use client"
import {
  Bell,
  CreditCard,
  Gift,
  Heart,
  Home,
  Link2,
  MapPin,
  Package,
  Settings,
  ShoppingCart,
  Star,
  User,
} from "lucide-react"
import type React from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { useSession } from "@/hooks/use-session"
import { links } from "@/lib/links"
import { AppLink } from "../../../../../modules/shared/components/app-link"

type NavItem = { readonly title: string; readonly url: string; readonly icon: React.ComponentType }
type SidebarData = { readonly navMain: readonly NavItem[]; readonly account: readonly NavItem[] }

const data: SidebarData = {
  navMain: [
    { title: "Overview", url: links.getDashboardUserHomeRoute(), icon: Home },
    { title: "Orders", url: links.getDashboardUserOrdersRoute(), icon: Package },
    { title: "Wishlist", url: links.getDashboardUserWishlistRoute(), icon: Heart },
    { title: "Reviews", url: links.getDashboardUserReviewsRoute(), icon: Star },
    { title: "Loyalty Points", url: links.getDashboardUserLoyaltyRoute(), icon: Gift },
    { title: "Affiliate", url: links.getDashboardUserAffiliateRoute(), icon: Link2 },
  ],
  account: [
    { title: "Profile", url: links.getDashboardUserSettingsProfileRoute(), icon: User },
    { title: "Addresses", url: links.getDashboardUserSettingsAddressesRoute(), icon: MapPin },
    // Placeholder: Payment Methods not yet implemented → route to Settings root
    { title: "Payment Methods", url: links.getDashboardUserSettingsRoute(), icon: CreditCard },
    { title: "Notifications", url: links.getDashboardUserSettingsNotificationsRoute(), icon: Bell },
    { title: "Settings", url: links.getDashboardUserSettingsRoute(), icon: Settings },
  ],
} as const

/**
 * User dashboard sidebar navigation.
 */
export function UserSidebar(): React.ReactElement {
  const session = useSession()
  const u = session?.user
  const displayName: string =
    u?.name && String(u.name).length > 0 ? String(u.name) : String(u?.email ?? "User")
  const displayEmail: string = String(u?.email ?? "")
  const initials: string = (
    displayName.includes(" ")
      ? displayName
          .split(" ")
          .filter((s) => s.length > 0)
          .slice(0, 2)
          .map((s) => s[0])
          .join("")
      : displayName.slice(0, 2)
  ).toUpperCase()
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <AppLink href={links.getDashboardUserHomeRoute()}>
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <ShoppingCart className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">ModularShop</span>
                  <span className="truncate text-xs">My Account</span>
                </div>
              </AppLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Dashboard</SidebarGroupLabel>
          <SidebarMenu>
            {data.navMain.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild tooltip={item.title}>
                  <AppLink href={item.url}>
                    <item.icon />
                    <span>{item.title}</span>
                  </AppLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Account</SidebarGroupLabel>
          <SidebarMenu>
            {data.account.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  className={item.title === "Settings" ? "hidden md:flex" : undefined}
                >
                  <AppLink href={item.url}>
                    <item.icon />
                    <span>{item.title}</span>
                  </AppLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <AppLink href={links.getDashboardUserSettingsProfileRoute()}>
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage
                    src={(u?.image as string | undefined) ?? undefined}
                    alt={displayName}
                  />
                  <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{displayName}</span>
                  {displayEmail && <span className="truncate text-xs">{displayEmail}</span>}
                </div>
              </AppLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
