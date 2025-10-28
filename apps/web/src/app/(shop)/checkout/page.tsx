import type { ReactElement } from "react"
import { CheckoutPageClient } from "./client"

export const dynamic = "force-dynamic"
export const fetchCache = "force-no-store"

export default function CheckoutPage(): ReactElement {
  return <CheckoutPageClient />
}
