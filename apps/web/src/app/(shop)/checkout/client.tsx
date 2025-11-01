"use client"

import { usePaypalConfig } from "@repo/payments/hooks/use-paypal-config"
import { usePaypalCreateOrder } from "@repo/payments/hooks/use-paypal-order"
import { useStripeConfig } from "@repo/payments/hooks/use-stripe-config"
import { QueryClientProvider, useQuery } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { type JSX, useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import { OrderSummary } from "@/components/checkout/order-summary"
import { PaymentForm } from "@/components/checkout/payment-form"
import { ShippingForm } from "@/components/checkout/shipping-form"
import { StripePaymentElement } from "@/components/checkout/stripe-payment-element"
import { Button } from "@/components/ui/button"
import { isDigitalOnlyCart } from "@/lib/cart/utils"
import { checkoutApi } from "@/lib/data/checkout"
import { ordersApi } from "@/lib/data/orders"
import { queryClient } from "@/lib/query-client"
import { useCartStore } from "@/lib/stores/cart"
import type { PaymentMethod, ShippingAddress } from "@/types/cart"
import { toOrderItemsFromCart } from "@/types/order"

export type CheckoutStep = "shipping" | "payment" | "review"
export type Totals = Readonly<{ subtotal: number; shipping: number; tax: number; total: number }>

function CheckoutContent(): JSX.Element | null {
  const router = useRouter()
  const { items, subtotal, shipping, tax, total, clearCart } = useCartStore()
  const isDigitalOnly: boolean = isDigitalOnlyCart(items)
  const [currentStep, setCurrentStep] = useState<CheckoutStep>(() =>
    isDigitalOnly ? "payment" : "shipping",
  )
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null)
  const [isPlacing, setIsPlacing] = useState<boolean>(false)
  const [confirmStripe, setConfirmStripe] = useState<
    (() => Promise<{ id: string; status: string } | null>) | null
  >(null)
  // Generate an idempotency key per checkout session for order creation
  const orderIdemKeyRef = useRef<string>(
    `ord_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`,
  )
  const paypalCfg = usePaypalConfig()
  const stripeCfg = useStripeConfig()
  const createPaypalOrder = usePaypalCreateOrder()

  // Build quote request payload; depends on items and shippingAddress
  const quoteReq = useMemo(() => {
    if (items.length === 0) return null
    const payload = {
      items: items.map((it) => ({
        productId: it.product.id,
        price: it.product.price,
        quantity: it.quantity,
      })),
      shippingAddress: isDigitalOnly
        ? undefined
        : shippingAddress
          ? {
              country: shippingAddress.country,
              state: shippingAddress.state,
              city: shippingAddress.city,
              zipCode: shippingAddress.zipCode,
            }
          : undefined,
    } as const
    return payload
  }, [items, shippingAddress, isDigitalOnly])

  const { data: quote } = useQuery<Totals | undefined>({
    queryKey: ["checkout-quote", quoteReq],
    queryFn: async () => {
      if (!quoteReq) return undefined
      try {
        return await checkoutApi.quote(quoteReq)
      } catch (err) {
        console.warn("quote failed, falling back to client totals", err)
        return undefined
      }
    },
    enabled: !!quoteReq,
    staleTime: 30_000,
  })

  const displayTotals = quote ?? { subtotal, shipping, tax, total }

  useEffect(() => {
    if (items.length === 0) {
      router.replace("/cart")
    }
  }, [items.length, router])
  if (items.length === 0) return null

  const handleShippingNext = (address: ShippingAddress) => {
    setShippingAddress(address)
    setCurrentStep("payment")
  }

  const handlePaymentNext = (payment: PaymentMethod) => {
    setPaymentMethod(payment)
    setCurrentStep("review")
  }

  const handlePlaceOrder = async (): Promise<void> => {
    if (isPlacing) return
    setIsPlacing(true)
    try {
      let desiredStatus: "pending" | "paid" = "pending"
      let paymentProvider: "stripe" | "paypal" | undefined
      let paymentRef: string | undefined
      if (paymentMethod?.type === "stripe") {
        const stripeConfigured: boolean | undefined = stripeCfg.data?.configured
        if (stripeConfigured === false) {
          toast.info("Stripe not configured; placing demo order without charge")
        } else if (!confirmStripe) {
          toast.error("Payment form not ready. Please try again.")
          setIsPlacing(false)
          return
        } else {
          try {
            const result = await confirmStripe()
            if (!result) {
              toast.error("Payment was not completed. Please try again.")
              setIsPlacing(false)
              return
            }
            if (result.status === "succeeded" || result.status === "requires_capture") {
              desiredStatus = "paid"
              paymentProvider = "stripe"
              paymentRef = result.id
            } else if (result.status === "processing") {
              // Accept processing: create order as pending and let webhook finalize status
              desiredStatus = "pending"
              paymentProvider = "stripe"
              paymentRef = result.id
              toast.info("Payment is processing. We'll confirm once completed.")
            } else {
              toast.error("Payment not successful. Please use a different method or try again.")
              setIsPlacing(false)
              return
            }
          } catch (err) {
            console.error("stripe confirm failed", err)
            toast.error(err instanceof Error ? err.message : "Payment confirmation failed")
            setIsPlacing(false)
            return
          }
        }
      } else if (paymentMethod?.type === "paypal") {
        const paypalConfigured: boolean | undefined = paypalCfg.data?.configured
        if (paypalConfigured === false) {
          toast.info("PayPal not configured; placing demo order without charge")
        } else {
          try {
            const amountForPayPalCents = Math.round((quote?.total ?? total) * 100)
            const created = await createPaypalOrder.mutateAsync({
              amountCents: amountForPayPalCents,
            })
            paymentProvider = "paypal"
            paymentRef = created.id
            desiredStatus = "pending"
            if (created.approveUrl) {
              window.open(created.approveUrl, "_blank", "noopener,noreferrer")
              toast.info(
                "Approve the PayPal payment in the opened window. We'll finalize the order via webhook once captured.",
              )
            } else {
              toast.info("PayPal order created. Complete approval to capture payment.")
            }
          } catch (err) {
            console.error("paypal create failed", err)
            toast.error(err instanceof Error ? err.message : "PayPal create order failed")
            setIsPlacing(false)
            return
          }
        }
      }
      const created = await ordersApi.create(
        {
          items: toOrderItemsFromCart(items),
          subtotal: displayTotals.subtotal,
          shipping: displayTotals.shipping,
          tax: displayTotals.tax,
          total: displayTotals.total,
          ...(shippingAddress ? { shippingAddress } : {}),
          status: desiredStatus,
          ...(paymentProvider ? { paymentProvider } : {}),
          ...(paymentRef ? { paymentRef } : {}),
        },
        { idempotencyKey: orderIdemKeyRef.current },
      )
      clearCart()
      toast.success("Order placed successfully")
      router.push(`/order-success/${created.id}`)
    } catch (e) {
      console.error("order create failed", e)
      toast.error("Failed to place order. Please try again.")
    } finally {
      setIsPlacing(false)
    }
  }

  const steps: { id: CheckoutStep; name: string; completed: boolean }[] = isDigitalOnly
    ? [
        { id: "payment", name: "Payment", completed: !!paymentMethod },
        { id: "review", name: "Review", completed: false },
      ]
    : [
        { id: "shipping", name: "Shipping", completed: !!shippingAddress },
        { id: "payment", name: "Payment", completed: !!paymentMethod },
        { id: "review", name: "Review", completed: false },
      ]

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      {/* Progress Steps */}
      <div className="flex flex-wrap items-center justify-center mb-8 gap-y-2 text-sm sm:text-base">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div
              className={`flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 ${
                step.id === currentStep
                  ? "border-primary bg-primary text-primary-foreground"
                  : step.completed
                    ? "border-green-500 bg-green-500 text-white"
                    : "border-muted-foreground text-muted-foreground"
              }`}
            >
              {step.completed ? "✓" : index + 1}
            </div>
            <span
              className={`ml-2 ${step.id === currentStep ? "font-medium" : "text-muted-foreground"}`}
            >
              {step.name}
            </span>
            {index < steps.length - 1 && (
              <div className="w-8 sm:w-12 h-px bg-muted-foreground mx-2 sm:mx-4" />
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {currentStep === "shipping" && !isDigitalOnly && (
            <ShippingForm onNext={handleShippingNext} /* savedAddresses={userSavedAddresses} */ />
          )}

          {currentStep === "payment" && (
            <PaymentForm
              onNext={handlePaymentNext}
              {...(!isDigitalOnly ? { onBack: () => setCurrentStep("shipping") } : {})}
              providers={
                isDigitalOnly ? ["stripe", "paypal", "card"] : ["card", "stripe", "paypal"]
              }
              backLabel={!isDigitalOnly ? "Back to Shipping" : undefined}
            />
          )}

          {currentStep === "review" &&
            ((isDigitalOnly && paymentMethod) || (shippingAddress && paymentMethod)) && (
              <div className="space-y-6">
                {paymentMethod?.type === "stripe" && (
                  <StripePaymentElement
                    amountCents={Math.round(displayTotals.total * 100)}
                    setConfirmFn={setConfirmStripe}
                  />
                )}
                <OrderSummary
                  shippingAddress={!isDigitalOnly ? shippingAddress : undefined}
                  paymentMethod={paymentMethod}
                  totalsOverride={displayTotals}
                />
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep("payment")}
                    className="w-full sm:flex-1"
                  >
                    Back to Payment
                  </Button>
                  <Button
                    onClick={handlePlaceOrder}
                    className="w-full sm:flex-1"
                    disabled={isPlacing}
                    aria-busy={isPlacing}
                  >
                    {isPlacing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isPlacing ? "Placing..." : "Place Order"}
                  </Button>
                </div>
              </div>
            )}
        </div>

        {/* Order Summary Sidebar */}
        {currentStep !== "review" && (
          <div className="lg:sticky lg:top-24 h-fit">
            <OrderSummary
              shippingAddress={shippingAddress}
              paymentMethod={paymentMethod}
              totalsOverride={displayTotals}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export function CheckoutPageClient(): React.ReactElement {
  return (
    <QueryClientProvider client={queryClient}>
      <CheckoutContent />
    </QueryClientProvider>
  )
}
