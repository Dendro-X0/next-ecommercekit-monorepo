/**
 * Commission calculation utilities.
 * One export per file.
 */
interface CalculateCommissionInput {
  readonly subtotalCents: number
  readonly pct: number // 0..100
}

/**
 * Calculate commission in cents from subtotal cents and a percentage.
 * @param input - subtotalCents (>=0) and pct [0,100]
 * @returns computed commission cents (>=0)
 */
export function calculateCommissionCents(input: CalculateCommissionInput): number {
  const pct: number = Number.isFinite(input.pct) ? Math.max(0, Math.min(100, input.pct)) : 0
  const base: number = Math.max(0, Math.round(input.subtotalCents))
  return Math.max(0, Math.round((base * pct) / 100))
}
