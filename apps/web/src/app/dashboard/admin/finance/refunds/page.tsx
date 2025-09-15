"use client"

import { Button } from "@components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card"
import { Input } from "@components/ui/input"
import { Label } from "@components/ui/label"
import { useStripeRefund } from "@repo/payments/hooks/use-stripe-refund"
import type React from "react"
import { useId, useState } from "react"
import { toast } from "sonner"
import { PageHeader } from "@/app/dashboard/_components/page-header"
import { Section } from "@/app/dashboard/_components/section"

interface RefundInput {
  readonly paymentRef: string
  readonly amountCents?: number
  readonly reason?: "duplicate" | "fraudulent" | "requested_by_customer"
}

/**
 * Admin → Finance → Refunds page.
 * Minimal utility to trigger Stripe refunds by PaymentIntent id.
 */
export default function RefundsPage(): React.ReactElement {
  const [paymentRef, setPaymentRef] = useState<string>("")
  const [amountCents, setAmountCents] = useState<string>("")
  const [reason, setReason] = useState<RefundInput["reason"]>(undefined)
  const paymentRefId = useId()
  const amountCentsId = useId()
  const reasonId = useId()

  const mutation = useStripeRefund()

  const onSubmit = (): void => {
    if (!paymentRef) {
      toast.info("Enter a PaymentIntent ID (e.g., pi_...)")
      return
    }
    const amt: number | undefined = amountCents ? Number(amountCents) : undefined
    if (amt !== undefined && (!Number.isInteger(amt) || amt <= 0)) {
      toast.info("Amount cents must be a positive integer")
      return
    }
    const payload: RefundInput = {
      paymentRef,
      ...(amt ? { amountCents: amt } : {}),
      ...(reason ? { reason } : {}),
    } as const
    mutation.mutate(payload, {
      onSuccess: (res: Readonly<{ id: string; status: string }>) => {
        toast.success(`Refund created: ${res.id} (${res.status})`)
      },
      onError: (err: unknown) => {
        const msg: string = err instanceof Error ? err.message : "Refund failed"
        toast.error(msg)
      },
    })
  }

  return (
    <Section>
      <PageHeader
        title="Refunds"
        description="Issue a refund for a Stripe PaymentIntent (admin only)."
      />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Create refund</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={paymentRefId}>PaymentIntent ID</Label>
              <Input
                id={paymentRefId}
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
                placeholder="pi_..."
                autoComplete="off"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={amountCentsId}>Amount (cents, optional)</Label>
              <Input
                id={amountCentsId}
                type="number"
                inputMode="numeric"
                value={amountCents}
                onChange={(e) => setAmountCents(e.target.value)}
                placeholder="e.g., 1234 for $12.34"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={reasonId}>Reason (optional)</Label>
              <select
                id={reasonId}
                className="w-full border rounded-md h-9 px-3 text-sm bg-background"
                value={reason ?? ""}
                onChange={(e) =>
                  setReason(e.target.value ? (e.target.value as RefundInput["reason"]) : undefined)
                }
              >
                <option value="">None</option>
                <option value="duplicate">Duplicate</option>
                <option value="fraudulent">Fraudulent</option>
                <option value="requested_by_customer">Requested by customer</option>
              </select>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={onSubmit}
                disabled={mutation.isPending}
                aria-busy={mutation.isPending}
              >
                {mutation.isPending ? "Submitting..." : "Submit refund"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setPaymentRef("")
                  setAmountCents("")
                  setReason(undefined)
                }}
              >
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Section>
  )
}
