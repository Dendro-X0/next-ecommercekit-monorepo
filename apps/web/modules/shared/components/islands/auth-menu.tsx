"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useSession } from "@/hooks/use-session"
import { authClient } from "@/lib/auth-client"
import { type Role, hasRole } from "@/lib/roles"
import { isAdminEmail } from "@/lib/admin-allowlist"
import { LayoutGrid, Settings, UserRound, LogOut } from "lucide-react"
import { AppLink } from "../app-link"
import type { JSX } from "react"

/**
 * AuthMenu renders login/register when signed out, and an avatar dropdown when signed in.
 * Client-only island to keep the main header as a server component.
 */
export function AuthMenu(): JSX.Element {
  const session = useSession()
  const user = session?.user ?? null
  if (!user) {
    return (
      <div className="hidden sm:flex items-center gap-2">
        <Button asChild size="sm" variant="ghost" className="text-gray-700 dark:text-gray-300">
          <AppLink href="/auth/login">Login</AppLink>
        </Button>
        <Button asChild size="sm" className="bg-black text-white dark:bg-white dark:text-black">
          <AppLink href="/auth/signup">Register</AppLink>
        </Button>
      </div>
    )
  }

  const roles = user?.roles as readonly Role[] | undefined
  const isAdmin: boolean = user?.isAdmin === true || hasRole(roles, ["admin"]) || isAdminEmail(user?.email ?? null)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="rounded-full focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white">
          <Avatar>
            <AvatarImage src={user.image ?? undefined} alt={user.name ?? "User"} />
            <AvatarFallback>
              {(user.name ?? "U").slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-48">
        <div className="px-2 py-1.5 text-xs text-muted-foreground">
          Signed in as
          <div className="text-foreground text-sm font-medium truncate">
            {user.email ?? user.name}
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <AppLink href="/dashboard/user" className="flex items-center gap-2">
            <LayoutGrid className="h-4 w-4" /> Dashboard
          </AppLink>
        </DropdownMenuItem>
        {isAdmin && (
          <DropdownMenuItem asChild>
            <AppLink href="/dashboard/admin" className="flex items-center gap-2">
              <LayoutGrid className="h-4 w-4" /> Admin
            </AppLink>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem asChild>
          <AppLink href="/dashboard/user" className="flex items-center gap-2">
            <UserRound className="h-4 w-4" /> Profile
          </AppLink>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <AppLink href="/dashboard/user/settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" /> Settings
          </AppLink>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={async () => {
            await authClient.signOut()
            window.location.assign("/")
          }}
          className="cursor-pointer"
        >
          <LogOut className="h-4 w-4" /> Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
