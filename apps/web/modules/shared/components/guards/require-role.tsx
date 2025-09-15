"use client"

import { useRouter } from "next/navigation"
import { type ReactElement, useEffect, useState } from "react"
import { authClient } from "@/lib/auth-client"
import { hasRole, type Role } from "@/lib/roles"

/**
 * RequireRole ensures a user session exists and the user has one of the required roles.
 * Redirects to the provided fallback (default: /auth/login) if checks fail.
 * @param props - roles required, optional fallback path, and children to render when authorized.
 */
export function RequireRole(props: {
  readonly roles: readonly Role[]
  readonly fallback?: string
  readonly children: ReactElement
}): ReactElement {
  const router = useRouter()
  const [checked, setChecked] = useState<boolean>(false)
  const [allowed, setAllowed] = useState<boolean>(false)
  useEffect(() => {
    let active = true
    void (async () => {
      const { data } = await authClient.getSession()
      if (!active) return
      const userRoles: readonly Role[] | undefined = (
        data?.user as { roles?: readonly Role[] } | undefined
      )?.roles
      const ok: boolean = Boolean(data?.session) && hasRole(userRoles, props.roles)
      setAllowed(ok)
      setChecked(true)
      if (!ok) router.replace(props.fallback ?? "/auth/login")
    })()
    return () => {
      active = false
    }
  }, [router, props.roles, props.fallback])
  if (!checked)
    return (
      <div className="p-6 text-center text-sm text-muted-foreground">Checking authorization…</div>
    )
  if (!allowed)
    return <div className="p-6 text-center text-sm text-muted-foreground">Redirecting…</div>
  return props.children
}
