"use client"

import { Minus, Plus, Trash2 } from "lucide-react"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { isDigitalProduct } from "@/lib/cart/utils"
import { useCartStore } from "@/lib/stores/cart"
import type { CartItem as CartItemType } from "@/types/cart"

interface CartItemProps {
  item: CartItemType
}

export function CartItem({ item }: CartItemProps) {
  const { updateQuantity, removeItem } = useCartStore()
  const isDigital: boolean = isDigitalProduct(item.product)

  return (
    <div className="flex flex-col sm:flex-row gap-4 py-6 border-b">
      {/* Product Image */}
      <div className="relative h-24 w-24 overflow-hidden rounded-md bg-muted">
        <Image
          src={item.product.images[0] || "/placeholder.svg"}
          alt={item.product.name}
          fill
          className="object-cover"
        />
      </div>

      {/* Product Details */}
      <div className="flex-1 space-y-2">
        <h3 className="font-medium">{item.product.name}</h3>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {item.product.category}
          </Badge>
          <Badge variant={isDigital ? "default" : "secondary"} className="text-xs">
            {isDigital ? "Download" : "Shipping"}
          </Badge>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <span className="font-semibold">${item.product.price}</span>

          {/* Quantity Controls */}
          <div className="flex items-center gap-2">
            <div className="flex items-center border rounded-md">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                disabled={item.quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="px-3 py-1 min-w-8 text-center">{item.quantity}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => updateQuantity(item.id, item.quantity + 1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeItem(item.id)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Item Total */}
      <div className="text-left sm:text-right mt-2 sm:mt-0">
        <div className="font-semibold">${(item.product.price * item.quantity).toFixed(2)}</div>
      </div>
    </div>
  )
}
