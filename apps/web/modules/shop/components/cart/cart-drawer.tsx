"use client"

import { ShoppingCart } from "lucide-react"
import type React from "react"
import { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { useCartStore } from "@/lib/stores/cart"
import { cn } from "@/lib/utils"
import { AppLink } from "../../../shared/components/app-link"
import { CartItem } from "./cart-item"
import { CartSummary } from "./cart-summary"

/**
 * Props for `CartDrawer` trigger customization.
 */
type CartDrawerProps = {
  /** Optional label to render next to the cart icon in the trigger button. */
  readonly label?: string
  /** When true, makes the trigger button span full width and center its content. */
  readonly fullWidth?: boolean
  /** Extra classes to merge into the trigger button. */
  readonly className?: string
}

/**
 * Cart slide-over drawer with trigger button. Renders current cart items and an order summary.
 * - By default renders an icon-only trigger suitable for headers.
 * - Provide `label` and `fullWidth` to render a mobile-friendly, full-width trigger.
 */
export function CartDrawer({
  label,
  fullWidth = false,
  className,
}: CartDrawerProps): React.ReactElement {
  const { items } = useCartStore()
  const itemCount: number = useMemo(() => items.reduce((acc, it) => acc + it.quantity, 0), [items])
  const [srMessage, setSrMessage] = useState<string>("")
  const prevCountRef = useRef<number>(itemCount)

  useEffect(() => {
    const prev = prevCountRef.current
    if (itemCount !== prev) {
      const diff = itemCount - prev
      const abs = Math.abs(diff)
      if (diff > 0) {
        setSrMessage(`Added ${abs} item${abs > 1 ? "s" : ""} to cart. Total ${itemCount}.`)
      } else {
        setSrMessage(`Removed ${abs} item${abs > 1 ? "s" : ""} from cart. Total ${itemCount}.`)
      }
      prevCountRef.current = itemCount
      const t = window.setTimeout(() => setSrMessage(""), 2000)
      return () => window.clearTimeout(t)
    }
    return
  }, [itemCount])

  return (
    <Sheet>
      {/* Screen reader live region announcing cart changes */}
      <output className="sr-only" aria-live="polite" aria-atomic="true">
        {srMessage}
      </output>
      <SheetTrigger asChild>
        <Button
          variant={label ? "default" : "ghost"}
          size={label ? "default" : "sm"}
          className={cn(
            "relative text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800",
            label && "bg-black text-white dark:bg-white dark:text-black",
            fullWidth && "w-full justify-center",
            className,
          )}
          aria-label={label ? undefined : "Open cart"}
        >
          <ShoppingCart className={cn("h-5 w-5", label && "mr-2")} />
          {label ? <span className="font-medium">{label}</span> : null}
          {itemCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-black dark:bg-white text-white dark:text-black text-xs flex items-center justify-center font-medium">
              {itemCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[90vw] sm:max-w-md p-0">
        <SheetHeader className="p-4">
          <SheetTitle>Shopping Cart</SheetTitle>
        </SheetHeader>
        <Separator />
        <div className="flex h-full flex-col">
          {items.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
              <ShoppingCart className="h-8 w-8 text-muted-foreground" />
              <div className="text-sm text-muted-foreground">Your cart is empty.</div>
              <Button asChild>
                <AppLink href="/shop">Continue shopping</AppLink>
              </Button>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-auto p-4">
                {items.map((it) => (
                  <CartItem key={it.id} item={it} />
                ))}
              </div>
              <div className="border-t p-4 space-y-4">
                <CartSummary />
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button asChild variant="outline" className="w-full sm:w-auto flex-1">
                    <AppLink href="/cart">View cart</AppLink>
                  </Button>
                  <Button asChild className="w-full sm:w-auto flex-1">
                    <AppLink href="/checkout">Checkout</AppLink>
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
