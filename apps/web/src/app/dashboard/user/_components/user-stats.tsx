import { ArrowUp as ArrowUpIcon, DollarSign, Gift, ShoppingCart, Star } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { UserStats } from "@/types/user"

interface UserStatsProps {
  stats: UserStats
}

export function UserStatsCards({ stats }: UserStatsProps) {
  const statItems = [
    {
      title: "Total Orders",
      value: stats.totalOrders,
      label: "+3 this month",
      icon: ShoppingCart,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Total Spent",
      value: `$${stats.totalSpent.toLocaleString()}`,
      label: "+$420 this month",
      icon: DollarSign,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Loyalty Points",
      value: stats.loyaltyPoints.toLocaleString(),
      label: "+125 earned",
      icon: Gift,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      title: "Money Saved",
      value: `$${stats.savedAmount}`,
      label: "Discounts & rewards",
      icon: Star,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
    },
    {
      title: "Avg Order Value",
      value: `$${stats.averageOrderValue.toFixed(2)}`,
      label: "Per order",
      icon: DollarSign,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      {statItems.map((item) => (
        <Card key={item.title} className="bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/50 transition-colors duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {item.title}
            </CardTitle>
            <div className={`p-2 rounded-lg ${item.bgColor}`}>
              <item.icon className={`h-4 w-4 ${item.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight">{item.value}</div>
            <div className="mt-1">
              <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-medium bg-secondary/50 text-secondary-foreground flex w-fit items-center gap-1">
                {item.label.startsWith("+") && <ArrowUpIcon className="h-2.5 w-2.5" />}
                {item.label}
              </Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
