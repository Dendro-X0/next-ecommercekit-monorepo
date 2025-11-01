"use client"

import { Heart } from "lucide-react"
import type React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SafeImage } from "@/components/ui/safe-image"
import { links } from "@/lib/links"
import type { Wishlist } from "@/types/user"
import { AppLink } from "../../../../../modules/shared/components/app-link"

interface WishlistPreviewProps {
  readonly wishlist: Wishlist | undefined
  readonly maxItems?: number
}

/**
 * Renders a compact preview of the user's wishlist with a link to the full page.
 * @param props - Component props
 * @param props.wishlist - Wishlist data to render
 * @param props.maxItems - Max number of items to display (default 3)
 * @returns React element
 */
export function WishlistPreview({
  wishlist,
  maxItems = 3,
}: WishlistPreviewProps): React.ReactElement {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Wishlist Items
            </CardTitle>
            <CardDescription>Items you&apos;re interested in</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <AppLink href={links.getDashboardUserWishlistRoute()}>View All</AppLink>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {(wishlist?.items ?? []).slice(0, maxItems).map((item) => (
            <div key={item.id} className="flex items-center gap-3">
              <div className="relative w-12 h-12 rounded-lg overflow-hidden">
                <SafeImage
                  src={`${item.image || "/placeholder.svg"}?height=48&width=48`}
                  alt={item.name}
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{item.name}</div>
                <div className="text-sm text-muted-foreground">${item.price}</div>
              </div>
              <Badge variant={item.inStock ? "default" : "secondary"}>
                {item.inStock ? "In Stock" : "Out of Stock"}
              </Badge>
            </div>
          ))}

          {(wishlist?.items?.length ?? 0) === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Heart className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>Your wishlist is empty</p>
              <Button variant="outline" size="sm" className="mt-2 bg-transparent" asChild>
                <AppLink href={links.getShopHomeRoute()}>Start Shopping</AppLink>
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
