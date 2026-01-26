"use client"

import { ArrowRight, Gift, Heart, ShoppingCart } from "lucide-react"
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
  const actions = [
    {
      title: "Track Orders",
      href: links.getDashboardUserOrdersRoute(),
      icon: ShoppingCart,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "View Wishlist",
      href: links.getDashboardUserWishlistRoute(),
      icon: Heart,
      color: "text-rose-500",
      bgColor: "bg-rose-500/10",
    },
    {
      title: "Redeem Points",
      href: links.getDashboardUserLoyaltyRoute(),
      icon: Gift,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      title: "Continue Shopping",
      href: links.getShopHomeRoute(),
      icon: ArrowRight,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
  ]

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-lg font-bold">Quick Actions</CardTitle>
        <CardDescription>Shortcut to your most used tools</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {actions.map((action) => (
          <Button
            key={action.title}
            variant="ghost"
            className="group w-full justify-between hover:bg-background/80 hover:shadow-sm border border-transparent hover:border-border/50 transition-all duration-300 px-3"
            asChild
          >
            <AppLink href={action.href}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${action.bgColor} ${action.color} group-hover:scale-110 transition-transform duration-300`}>
                  <action.icon className="h-4 w-4" />
                </div>
                <span className="font-semibold text-sm">{action.title}</span>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
            </AppLink>
          </Button>
        ))}
      </CardContent>
    </Card>
  )
}
