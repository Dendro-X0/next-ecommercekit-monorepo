/**
 * Cart calculation constants.
 * One export per file: constants only.
 */

/** Orders above this subtotal get free shipping (USD). */
export const FREE_SHIPPING_THRESHOLD: number = 50
/** Flat shipping fee when threshold not met (USD). */
export const FLAT_SHIPPING_FEE: number = 9.99
/** Sales tax rate applied to subtotal (0-1). */
export const TAX_RATE: number = 0.08
