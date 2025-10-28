"use client"

import type React from "react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { authClient } from "@/lib/auth-client"

type SessionSummary = {
  readonly token: string
  readonly createdAt: string
  readonly updatedAt: string
  readonly expiresAt: string
  readonly ipAddress?: string | null
  readonly userAgent?: string | null
  readonly current?: boolean
}

type BusyKey = string | "ALL" | "OTHERS" | null

/**
 * Renders the user's active device sessions with actions to revoke sessions.
 * Data is fetched via Better Auth client: `listSessions`, `revokeSession`, `revokeOtherSessions`, `revokeSessions`.
 */
export function TrustedDevices(): React.ReactElement {
  const [sessions, setSessions] = useState<readonly SessionSummary[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<BusyKey>(null)

  const loadSessions = useCallback(async (): Promise<void> => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: err } = (await authClient.listSessions()) as {
        data: readonly SessionSummary[] | null
        error?: { message?: string } | null
      }
      if (err) {
        setError(err.message ?? "Failed to load sessions.")
        setSessions([])
      } else {
        setSessions((data ?? []) as readonly SessionSummary[])
      }
    } catch (e) {
      const m: string = e instanceof Error ? e.message : "Failed to load sessions."
      setError(m)
      setSessions([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadSessions()
  }, [loadSessions])

  const revokeSingle = useCallback(
    async (token: string): Promise<void> => {
      setBusy(token)
      setError(null)
      try {
        await authClient.revokeSession({ token })
        await loadSessions()
      } catch (e) {
        const m: string = e instanceof Error ? e.message : "Failed to revoke session."
        setError(m)
      } finally {
        setBusy(null)
      }
    },
    [loadSessions],
  )

  const revokeOthers = useCallback(async (): Promise<void> => {
    setBusy("OTHERS")
    setError(null)
    try {
      await authClient.revokeOtherSessions()
      await loadSessions()
    } catch (e) {
      const m: string = e instanceof Error ? e.message : "Failed to revoke other sessions."
      setError(m)
    } finally {
      setBusy(null)
    }
  }, [loadSessions])

  const revokeAll = useCallback(async (): Promise<void> => {
    setBusy("ALL")
    setError(null)
    try {
      await authClient.revokeSessions()
      await loadSessions()
    } catch (e) {
      const m: string = e instanceof Error ? e.message : "Failed to revoke all sessions."
      setError(m)
    } finally {
      setBusy(null)
    }
  }, [loadSessions])

  const parsed = useMemo(
    () =>
      sessions.map((s) => ({
        token: s.token,
        ip: s.ipAddress ?? "Unknown",
        ua: parseUserAgent(s.userAgent ?? "Unknown"),
        current: Boolean(s.current),
        updatedAt: new Date(s.updatedAt),
      })),
    [sessions],
  )

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">Trusted devices</h3>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void revokeOthers()}
            disabled={busy !== null || loading}
            className="px-3 py-1 rounded border"
          >
            Sign out others
          </button>
          <button
            type="button"
            onClick={() => void revokeAll()}
            disabled={busy !== null || loading}
            className="px-3 py-1 rounded border text-red-600"
          >
            Sign out all
          </button>
        </div>
      </div>
      {error && <div className="text-sm text-red-600">{error}</div>}
      {loading ? (
        <div className="text-sm text-muted-foreground">Loading sessions…</div>
      ) : parsed.length === 0 ? (
        <div className="text-sm text-muted-foreground">No active sessions found.</div>
      ) : (
        <ul className="divide-y rounded border">
          {parsed.map((item) => (
            <li key={item.token} className="flex items-center justify-between p-3">
              <div className="flex flex-col">
                <span className="font-medium">{item.ua}</span>
                <span className="text-xs text-muted-foreground">
                  IP {item.ip} • Last active {formatRelative(item.updatedAt)}
                </span>
                {item.current && <span className="text-xs text-green-700">This device</span>}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void revokeSingle(item.token)}
                  disabled={busy !== null || loading}
                  className="px-3 py-1 rounded border"
                >
                  Revoke
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function parseUserAgent(ua: string): string {
  if (ua.includes("Chrome")) return "Chrome"
  if (ua.includes("Firefox")) return "Firefox"
  if (ua.includes("Safari") && !ua.includes("Chrome")) return "Safari"
  if (ua.includes("Edg")) return "Edge"
  return ua.slice(0, 64)
}

function formatRelative(date: Date): string {
  const diffMs: number = Date.now() - date.getTime()
  const sec: number = Math.max(1, Math.floor(diffMs / 1000))
  if (sec < 60) return `${sec}s ago`
  const min: number = Math.floor(sec / 60)
  if (min < 60) return `${min}m ago`
  const hr: number = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  const d: number = Math.floor(hr / 24)
  return `${d}d ago`
}
