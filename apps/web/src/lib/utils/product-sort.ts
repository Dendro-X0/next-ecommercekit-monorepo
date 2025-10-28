/**
 * Map UI sort values to API sort values.
 * One export per file as per project conventions.
 */

// API sort value type (local to this file to keep single export per file)
type ApiSort = "newest" | "price_asc" | "price_desc"

/**
 * Map a UI sort value to the corresponding API sort parameter.
 * Rating and popularity are client-only sorts; they fall back to "newest" for the API.
 *
 * @param value - UI sort value selected by the user
 * @returns API sort value understood by the backend
 */
export function mapSortToApi(value: string): ApiSort {
  if (value === "price-low") return "price_asc"
  if (value === "price-high") return "price_desc"
  return "newest"
}
