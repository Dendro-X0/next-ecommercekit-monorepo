export default function generateAffiliateCode(): string {
  const rand: string = Math.random().toString(36).slice(2, 8).toUpperCase()
  return `AFF-${rand}`
}
