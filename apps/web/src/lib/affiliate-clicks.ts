import type { AffiliateClick } from "@/types/affiliate-click"

const affiliateClicks: readonly AffiliateClick[] = [
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

export default affiliateClicks
