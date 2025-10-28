"use client"

import { usePaypalCapture } from "@repo/payments/hooks/use-paypal-order"
import { Loader2 } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import type { JSX } from "react"
import { useEffect, useMemo } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

/**
 * Handles PayPal return redirect. Captures the PayPal order using the `token` query param,
 * then redirects the user to their orders page.
 */
export default function PaypalReturnPage(): JSX.Element {
  const router = useRouter()
  const search = useSearchParams()
  const token: string | null = useMemo(() => search.get("token"), [search])
  const ORDERS_PATH: string = "/dashboard/user/orders"
  const captureMut = usePaypalCapture()

  useEffect(() => {
    if (!token) {
      toast.error("Missing PayPal token")
      return
    }
    if (!captureMut.isPending && !captureMut.isSuccess) {
      captureMut.mutate(
        { orderId: token },
        {
          onSuccess: () => {
            toast.success("Payment captured successfully")
            router.replace(ORDERS_PATH)
          },
          onError: (err: unknown) => {
            const message: string = err instanceof Error ? err.message : "Failed to capture payment"
            toast.error(message)
          },
        },
      )
    }
  }, [token, captureMut, router.replace])

  return (
    <div className="container mx-auto px-4 py-16 max-w-lg text-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <h1 className="text-2xl font-semibold">Finalizing your payment…</h1>
        <p className="text-muted-foreground">Please wait while we confirm your PayPal payment.</p>
        <div className="pt-4">
          <Button variant="outline" onClick={() => router.replace(ORDERS_PATH)}>
            Go to My Orders
          </Button>
        </div>
      </div>
    </div>
  )
}
