"use client"

import { useStripeConfig } from "@repo/payments/hooks/use-stripe-config"
import { useStripeIntent } from "@repo/payments/hooks/use-stripe-intent"
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js"
import { loadStripe } from "@stripe/stripe-js"
import { AlertCircle } from "lucide-react"
import type { JSX } from "react"
import { useEffect, useMemo, useRef, useState } from "react"

/**
 * Props for StripePaymentElement.
 * - amountCents: integer amount in cents.
 * - currency: ISO currency (default: usd)
 * - setConfirmFn: setter to receive a confirm function that triggers payment confirmation.
 */
interface StripeElementProps {
  readonly amountCents: number
  readonly currency?: string
  readonly setConfirmFn: (fn: (() => Promise<{ id: string; status: string } | null>) | null) => void
}

/** Wrapper to mount Elements once we have a clientSecret */
function StripeElementInner({
  amountCents,
  currency = "usd",
  setConfirmFn,
}: StripeElementProps): JSX.Element {
  const stripe = useStripe()
  const elements = useElements()
  useEffect(() => {
    if (!stripe || !elements) return
    const fn = async (): Promise<{ id: string; status: string } | null> => {
      const result = await stripe.confirmPayment({ elements, redirect: "if_required" })
      if (result.error) {
        throw new Error(result.error.message ?? "Payment confirmation failed")
      }
      return result.paymentIntent
        ? { id: result.paymentIntent.id, status: result.paymentIntent.status }
        : null
    }
    setConfirmFn(fn)
    return () => setConfirmFn(null)
  }, [stripe, elements, setConfirmFn])

  return (
    <div className="border rounded-md p-4">
      <PaymentElement options={{ layout: "tabs" }} />
      <p className="mt-2 text-xs text-muted-foreground">
        You will be charged {amountCents / 100} {currency.toUpperCase()}.
      </p>
    </div>
  )
}

/**
 * StripePaymentElement mounts Stripe Elements using a freshly created PaymentIntent.
 * It exposes a confirm function via setConfirmFn to be called on Place Order.
 */
export function StripePaymentElement({
  amountCents,
  currency = "usd",
  setConfirmFn,
}: StripeElementProps): JSX.Element {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  // Generate a random idempotency key for PaymentIntent creation per mount
  const idemKeyRef = useRef<string>(
    `pi_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`,
  )

  const pubKey: string | undefined = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  const stripePromise = useMemo(() => (pubKey ? loadStripe(pubKey) : null), [pubKey])
  const stripeCfg = useStripeConfig()
  const createIntent = useStripeIntent()

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        if (!stripeCfg.data?.configured || !pubKey) {
          setError("Stripe is not configured. Using demo checkout.")
          return
        }
        const res = await createIntent.mutateAsync({
          amountCents,
          currency,
          metadata: { source: "checkout" },
          idempotencyKey: idemKeyRef.current,
        })
        if (!active) return
        setClientSecret(res.clientSecret ?? null)
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unable to initialize Stripe.")
      }
    })()
    return () => {
      active = false
      setConfirmFn(null)
    }
  }, [amountCents, currency, pubKey, stripeCfg.data?.configured, setConfirmFn, createIntent])

  if (!pubKey) {
    return (
      <div className="flex items-start gap-2 text-amber-600 text-sm">
        <AlertCircle className="h-4 w-4 mt-0.5" /> Stripe publishable key is missing.
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-start gap-2 text-amber-600 text-sm">
        <AlertCircle className="h-4 w-4 mt-0.5" /> {error}
      </div>
    )
  }

  if (!stripePromise || !clientSecret) {
    return <div className="text-sm text-muted-foreground">Loading payment form…</div>
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <StripeElementInner
        amountCents={amountCents}
        currency={currency}
        setConfirmFn={setConfirmFn}
      />
    </Elements>
  )
}
