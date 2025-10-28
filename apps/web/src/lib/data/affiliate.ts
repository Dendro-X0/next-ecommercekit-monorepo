/**
 * Typed client for Affiliate APIs.
 */

export type AffiliateProfile = Readonly<{ id: string; code: string }>
export type AffiliateSummary = Readonly<{ totalClicks: number; conversions: number }>
export type AffiliateMeResponse = Readonly<{ profile: AffiliateProfile; stats: AffiliateSummary }>
export type AffiliateClickItem = Readonly<{ id: string; date: string; source: string | null }>
export type AffiliateClicksResponse = Readonly<{ items: readonly AffiliateClickItem[] }>
export type AffiliateConversionItem = Readonly<{
  id: string
  orderId: string
  commissionCents: number
  status: "pending" | "approved" | "paid"
  createdAt: string
}>
export type AffiliateConversionsResponse = Readonly<{ items: readonly AffiliateConversionItem[] }>

const base = "/api/v1/affiliate" as const

async function getMe(): Promise<AffiliateMeResponse> {
  const res = await fetch(`${base}/me`, { credentials: "include" })
  if (!res.ok) throw new Error(`Failed to load affiliate profile (${res.status})`)
  return (await res.json()) as AffiliateMeResponse
}

async function regenerateCode(): Promise<AffiliateProfile> {
  const res = await fetch(`${base}/me/code`, { method: "POST", credentials: "include" })
  if (!res.ok) throw new Error(`Failed to regenerate affiliate code (${res.status})`)
  const data = (await res.json()) as { profile: AffiliateProfile }
  return data.profile
}

async function listClicks(): Promise<readonly AffiliateClickItem[]> {
  const res = await fetch(`${base}/me/clicks`, { credentials: "include" })
  if (!res.ok) throw new Error(`Failed to list affiliate clicks (${res.status})`)
  const data = (await res.json()) as AffiliateClicksResponse
  return data.items
}

async function listConversions(): Promise<readonly AffiliateConversionItem[]> {
  const res = await fetch(`${base}/me/conversions`, { credentials: "include" })
  if (!res.ok) throw new Error(`Failed to list affiliate conversions (${res.status})`)
  const data = (await res.json()) as AffiliateConversionsResponse
  return data.items
}

async function track(input: Readonly<{ code: string; source?: string }>): Promise<void> {
  const res = await fetch(`${base}/track`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ code: input.code, source: input.source ?? undefined }),
  })
  if (!res.ok) throw new Error(`Failed to track affiliate click (${res.status})`)
}

export const affiliateApi = { getMe, regenerateCode, listClicks, listConversions, track } as const
export type AffiliateApi = typeof affiliateApi
