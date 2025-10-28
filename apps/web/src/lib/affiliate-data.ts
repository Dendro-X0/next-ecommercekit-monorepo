export interface AffiliateStats {
  readonly code: string
  readonly totalClicks: number
  readonly conversions: number
  readonly commissionEarned: number
}

export interface AffiliateClick {
  readonly id: string
  readonly date: string
  readonly source: string
  readonly device: "Desktop" | "Mobile" | "Tablet"
  readonly status: "Clicked" | "Converted"
  readonly commission: number
}

export const affiliateStats: AffiliateStats = {
  code: "AFF-1A2B3C",
  totalClicks: 142,
  conversions: 18,
  commissionEarned: 256.75,
}

export const affiliateClicks: readonly AffiliateClick[] = [
  {
    id: "ac-1",
    date: "2025-08-18",
    source: "Twitter",
    device: "Mobile",
    status: "Clicked",
    commission: 0,
  },
  {
    id: "ac-2",
    date: "2025-08-17",
    source: "Blog",
    device: "Desktop",
    status: "Converted",
    commission: 14.5,
  },
  {
    id: "ac-3",
    date: "2025-08-16",
    source: "YouTube",
    device: "Desktop",
    status: "Clicked",
    commission: 0,
  },
  {
    id: "ac-4",
    date: "2025-08-15",
    source: "Newsletter",
    device: "Mobile",
    status: "Converted",
    commission: 18.2,
  },
]

export function generateAffiliateCode(): string {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase()
  return `AFF-${rand}`
}
