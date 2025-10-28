export interface AffiliateClick {
  readonly id: string
  readonly date: string
  readonly source: string
  readonly device: "Desktop" | "Mobile" | "Tablet"
  readonly status: "Clicked" | "Converted"
  readonly commission: number
}
