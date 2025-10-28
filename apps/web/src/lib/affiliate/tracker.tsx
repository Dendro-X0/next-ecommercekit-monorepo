"use client"

import { useMutation } from "@tanstack/react-query"
import type React from "react"
import { useEffect } from "react"
import { affiliateApi } from "@/lib/data/affiliate"

/**
 * Tracks an affiliate click once per session when AFF_REF cookie is present.
 * One export per file.
 */
export function AffiliateTracker(): React.ReactElement | null {
  const m = useMutation({ mutationFn: affiliateApi.track })
  useEffect((): void => {
    const code: string | null = readCookie("AFF_REF")
    if (!code) return
    const key: string = `affiliate_tracked_${code}`
    const done: string | null = sessionStorage.getItem(key)
    if (done) return
    const source: string = typeof window !== "undefined" ? window.location.pathname : "/"
    m.mutate({ code, source })
    sessionStorage.setItem(key, "1")
  }, [m])
  return null
}

function readCookie(name: string): string | null {
  const entries: readonly string[] = document.cookie.split("; ")
  for (const entry of entries) {
    if (!entry) continue
    const idx: number = entry.indexOf("=")
    if (idx === -1) continue
    const k: string = entry.slice(0, idx)
    if (k !== name) continue
    const v: string = entry.slice(idx + 1)
    try {
      return decodeURIComponent(v)
    } catch {
      return v
    }
  }
  return null
}
