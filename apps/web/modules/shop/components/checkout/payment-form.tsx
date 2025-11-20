"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { usePaypalConfig } from "@repo/payments/hooks/use-paypal-config"
import { useStripeConfig } from "@repo/payments/hooks/use-stripe-config"
import { CreditCard } from "lucide-react"
import type React from "react"
import type { JSX } from "react"
import { useId, useMemo, useState } from "react"
import { type SubmitHandler, useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import type { PaymentMethod } from "@/types/cart"

/**
 * Checkout payment step. Supports custom provider ordering and optional back button.
 * Currently wires Stripe and PayPal (plus a demo card flow). Other providers such
 * as Polar can be integrated via separate flows, not this form.
 */
/**
 * Props for `PaymentForm`.
 * @property onNext - Callback invoked when the payment method is ready to proceed to the next step.
 * @property onBack - Optional callback to go back to the previous step.
 * @property providers - Optional list to control which payment providers are shown and their order.
 * @property backLabel - Optional label for the back button.
 */
interface PaymentFormProps {
  onNext: (paymentMethod: PaymentMethod) => void
  onBack?: () => void
  providers?: ReadonlyArray<PaymentMethod["type"]>
  backLabel?: string
}

/**
 * Payment method form with validation for card details using react-hook-form + Zod.
 * Preserves non-card providers as placeholders and supports a back button.
 * @param props - See `PaymentFormProps`.
 * @returns JSX element rendering the payment method step.
 */
export function PaymentForm({
  onNext,
  onBack,
  providers,
  backLabel,
}: PaymentFormProps): JSX.Element {
  const uid = useId()
  const fid = (name: string): string => `${uid}-${name}`
  type CardData = Readonly<{
    number: string
    expiryMonth: string
    expiryYear: string
    cvv: string
    name: string
  }>
  const defaultProviders: ReadonlyArray<PaymentMethod["type"]> = ["card", "stripe", "paypal"]
  const availableProviders: ReadonlyArray<PaymentMethod["type"]> = providers ?? defaultProviders
  const [paymentType, setPaymentType] = useState<PaymentMethod["type"]>(availableProviders[0])
  const stripeCfg = useStripeConfig()
  const paypalCfg = usePaypalConfig()
  const stripeConfigured: boolean = stripeCfg.data?.configured === true
  const paypalConfigured: boolean = paypalCfg.data?.configured === true
  const cardSchema = useMemo(
    () =>
      z.object({
        name: z.string().min(2, "Cardholder name is required"),
        number: z
          .string()
          .transform((v) => v.replace(/\s+/g, ""))
          .refine((v) => /^\d{12,19}$/.test(v), { message: "Enter a valid card number" }),
        expiryMonth: z
          .string()
          .refine((v) => /^(0?[1-9]|1[0-2])$/.test(v), { message: "Invalid month" }),
        expiryYear: z.string().refine((v) => /^\d{4}$/.test(v), { message: "Invalid year" }),
        cvv: z.string().refine((v) => /^\d{3,4}$/.test(v), { message: "Invalid CVV" }),
      }),
    [],
  )

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CardData>({
    resolver: zodResolver(cardSchema),
    defaultValues: { name: "", number: "", expiryMonth: "", expiryYear: "", cvv: "" },
    mode: "onBlur",
  })

  function providerLabel(p: PaymentMethod["type"]): string {
    switch (p) {
      case "card":
        return "Credit/Debit Card"
      case "stripe":
        return stripeConfigured ? "Stripe" : "Stripe (demo)"
      case "paypal":
        return paypalConfigured ? "PayPal" : "PayPal (demo)"
      default:
        return "Payment"
    }
  }

  function buildAndNext(card?: CardData): void {
    let displayName: string
    switch (paymentType) {
      case "card":
        displayName = `${card?.name ?? "Card"} ending in ${(card?.number ?? "").slice(-4)}`
        break
      case "stripe":
        displayName = "Stripe"
        break
      case "paypal":
        displayName = "PayPal"
        break
      default:
        displayName = "Payment"
    }
    const method: PaymentMethod = {
      id: Date.now().toString(),
      type: paymentType,
      name: displayName,
      ...(paymentType === "card" &&
        card && {
          last4: card.number.replace(/\s+/g, "").slice(-4),
          expiryMonth: Number.parseInt(card.expiryMonth, 10),
          expiryYear: Number.parseInt(card.expiryYear, 10),
        }),
    }
    onNext(method)
  }

  const onSubmitCard: SubmitHandler<CardData> = (values): void => buildAndNext(values)
  const onSubmit: React.FormEventHandler<HTMLFormElement> =
    paymentType === "card"
      ? handleSubmit(onSubmitCard)
      : (e): void => {
          e.preventDefault()
          buildAndNext()
        }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Method</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-6">
          <RadioGroup
            value={paymentType}
            onValueChange={(value) => setPaymentType(value as PaymentMethod["type"])}
          >
            {availableProviders.map((p) => (
              <div key={p} className="flex items-center space-x-2 p-4 border rounded-lg">
                <RadioGroupItem value={p} id={fid(`provider-${p}`)} />
                <Label
                  htmlFor={fid(`provider-${p}`)}
                  className={`cursor-pointer ${p === "card" ? "flex items-center gap-2" : ""}`}
                >
                  {p === "card" && <CreditCard className="h-4 w-4" />}
                  {providerLabel(p)}
                </Label>
              </div>
            ))}
          </RadioGroup>

          {paymentType === "card" && (
            <div className="space-y-4">
              <div>
                <Label htmlFor={fid("cardName")}>Cardholder Name</Label>
                <Input id={fid("cardName")} {...register("name")} />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              </div>

              <div>
                <Label htmlFor={fid("cardNumber")}>Card Number</Label>
                <Input
                  id={fid("cardNumber")}
                  placeholder="1234 5678 9012 3456"
                  inputMode="numeric"
                  {...register("number")}
                />
                {errors.number && (
                  <p className="text-sm text-destructive">{errors.number.message}</p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 sm:gap-4">
                <div>
                  <Label htmlFor={fid("expiryMonth")}>Month</Label>
                  <Input
                    id={fid("expiryMonth")}
                    placeholder="MM"
                    inputMode="numeric"
                    {...register("expiryMonth")}
                  />
                  {errors.expiryMonth && (
                    <p className="text-sm text-destructive">{errors.expiryMonth.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor={fid("expiryYear")}>Year</Label>
                  <Input
                    id={fid("expiryYear")}
                    placeholder="YYYY"
                    inputMode="numeric"
                    {...register("expiryYear")}
                  />
                  {errors.expiryYear && (
                    <p className="text-sm text-destructive">{errors.expiryYear.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor={fid("cvv")}>CVV</Label>
                  <Input
                    id={fid("cvv")}
                    placeholder="123"
                    inputMode="numeric"
                    {...register("cvv")}
                  />
                  {errors.cvv && <p className="text-sm text-destructive">{errors.cvv.message}</p>}
                </div>
              </div>
            </div>
          )}

          {onBack ? (
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                className="w-full sm:w-auto flex-1 bg-transparent"
              >
                {backLabel ?? "Back"}
              </Button>
              <Button
                type="submit"
                className="w-full sm:w-auto flex-1"
                disabled={paymentType === "card" && isSubmitting}
              >
                Review Order
              </Button>
            </div>
          ) : (
            <div>
              <Button
                type="submit"
                className="w-full"
                disabled={paymentType === "card" && isSubmitting}
              >
                Review Order
              </Button>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
