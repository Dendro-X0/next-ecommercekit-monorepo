"use client"

import { QueryClientProvider, useQuery } from "@tanstack/react-query"
import type { JSX } from "react"
import * as React from "react"
import { queryClient } from "@/lib/query-client"

export interface Session {
  readonly user: {
    readonly id?: string
    readonly email?: string
    readonly name?: string | null
    readonly image?: string | null
    readonly roles?: readonly string[]
    readonly emailVerified?: boolean
    readonly isAdmin?: boolean
  } | null
}

// Query client is provided by shared singleton in `@/lib/query-client`.

const SessionContext = React.createContext<{ readonly session: Session | undefined } | undefined>(
  undefined,
)

export function SessionProvider({ children }: { readonly children: React.ReactNode }): JSX.Element {
  const { data: session } = useQuery<Session>({
    queryKey: ["session"],
    queryFn: async (): Promise<Session> => {
      const frontendOnlyEnv: string = (
        process.env.NEXT_PUBLIC_FRONTEND_ONLY ?? "false"
      ).toLowerCase()
      const frontendOnly: boolean = frontendOnlyEnv === "true"
      if (frontendOnly) {
        // Frontend-only mode: skip backend and treat as signed-out
        return { user: null }
      }
      const res = await fetch("/api/me", { credentials: "include" })
      if (!res.ok) return { user: null }
      const payload = (await res.json()) as {
        readonly user: {
          readonly id?: string
          readonly email?: string
          readonly name?: string | null
          readonly image?: string | null
          readonly roles?: readonly string[]
          readonly emailVerified?: boolean
          readonly isAdmin?: boolean
        } | null
      }
      return { user: payload.user }
    },
    staleTime: 5 * 60_000,
    retry: 1,
    placeholderData: (previous): Session | undefined => previous as Session | undefined,
  })

  return <SessionContext.Provider value={{ session }}>{children}</SessionContext.Provider>
}

/**
 * SessionProviderStatic: lightweight provider that supplies a fixed session value
 * without React Query. Useful for minimal boot mode where we avoid heavy
 * providers but components still call useSession().
 */
export function SessionProviderStatic({
  children,
  session = { user: null },
}: Readonly<{ children: React.ReactNode; session?: Session }>): JSX.Element {
  return <SessionContext.Provider value={{ session }}>{children}</SessionContext.Provider>
}

export function AppWithQueryClient({
  children,
}: {
  readonly children: React.ReactNode
}): JSX.Element {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>{children}</SessionProvider>
    </QueryClientProvider>
  )
}

export function useSession(): Session | undefined {
  const context = React.useContext(SessionContext)
  if (!context) {
    throw new Error("useSession must be used within a SessionProvider")
  }
  return context.session
}

/**
 * AppWithStaticSession
 * A client component wrapper that mounts QueryClientProvider and SessionProviderStatic.
 * Safe to render from a Server Component without passing class instances in props.
 */
export function AppWithStaticSession({
  children,
}: Readonly<{ children: React.ReactNode }>): JSX.Element {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProviderStatic session={{ user: null }}>{children}</SessionProviderStatic>
    </QueryClientProvider>
  )
}
