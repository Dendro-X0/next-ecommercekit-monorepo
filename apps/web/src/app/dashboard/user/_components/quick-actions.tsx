"use client"

import { ArrowRight, Gift, Heart } from "lucide-react"
import type React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { links } from "@/lib/links"
import { AppLink } from "../../../../../modules/shared/components/app-link"

/**
 * QuickActions
 * A reusable card with commonly-used dashboard actions.
 * Frontend-only: links to existing routes; no backend calls.
 */
export function QuickActions(): React.ReactElement {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5" />
          Quick Actions
        </CardTitle>
        <CardDescription>Frequently used features</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button variant="outline" className="w-full justify-start bg-transparent" asChild>
          <AppLink href={links.getDashboardUserOrdersRoute()} aria-label="Track Orders">
            <ArrowRight className="mr-2 h-4 w-4" />
            Track Orders
          </AppLink>
        </Button>
        <Button variant="outline" className="w-full justify-start bg-transparent" asChild>
          <AppLink href={links.getDashboardUserWishlistRoute()} aria-label="View Wishlist">
            <Heart className="mr-2 h-4 w-4" />
            View Wishlist
          </AppLink>
        </Button>
        <Button variant="outline" className="w-full justify-start bg-transparent" asChild>
          <AppLink href={links.getDashboardUserLoyaltyRoute()} aria-label="Redeem Points">
            <Gift className="mr-2 h-4 w-4" />
            Redeem Points
          </AppLink>
        </Button>
        <Button variant="outline" className="w-full justify-start bg-transparent" asChild>
          <AppLink href={links.getShopHomeRoute()} aria-label="Continue Shopping">
            <ArrowRight className="mr-2 h-4 w-4" />
            Continue Shopping
          </AppLink>
        </Button>
      </CardContent>
    </Card>
  )
}
