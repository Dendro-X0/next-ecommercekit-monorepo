"use client"

import { useRouter } from "next/navigation"
import { type ReactElement, useEffect, useState } from "react"
import { authClient } from "@/lib/auth-client"

/**
 * RequireAuth ensures a user session exists. If not, redirects to /auth/login.
 * @param props - The component children to render when authenticated.
 */
export function RequireAuth(props: { readonly children: ReactElement }): ReactElement {
  const router = useRouter()
  const [checked, setChecked] = useState<boolean>(false)
  const [hasSession, setHasSession] = useState<boolean>(false)
  useEffect(() => {
    let active = true
    void (async () => {
      const { data } = await authClient.getSession()
      if (!active) return
      const exists: boolean = Boolean(data?.session)
      setHasSession(exists)
      setChecked(true)
      if (!exists) router.replace("/auth/login")
    })()
    return () => {
      active = false
    }
  }, [router])
  if (!checked) {
    return (
      <div className="p-6 text-center text-sm text-muted-foreground">Checking authentication…</div>
    )
  }
  if (!hasSession) {
    return <div className="p-6 text-center text-sm text-muted-foreground">Redirecting…</div>
  }
  return props.children
}
