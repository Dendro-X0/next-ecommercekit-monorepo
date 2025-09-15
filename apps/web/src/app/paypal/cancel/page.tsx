"use client"

import { XCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import type { JSX } from "react"
import { Button } from "@/components/ui/button"

/**
 * Shown when the user cancels PayPal checkout.
 */
export default function PaypalCancelPage(): JSX.Element {
  const router = useRouter()
  return (
    <div className="container mx-auto px-4 py-16 max-w-lg text-center">
      <div className="flex flex-col items-center gap-4">
        <XCircle className="h-10 w-10 text-destructive" />
        <h1 className="text-2xl font-semibold">Payment cancelled</h1>
        <p className="text-muted-foreground">
          Your PayPal payment was cancelled. You can return to checkout to try again.
        </p>
        <div className="pt-4 flex gap-3">
          <Button variant="outline" onClick={() => router.replace("/cart")}>
            Back to Cart
          </Button>
          <Button onClick={() => router.replace("/checkout")}>Return to Checkout</Button>
        </div>
      </div>
    </div>
  )
}
