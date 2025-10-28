import { Crown, Gift, Star } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { User } from "@/types/user"

interface MembershipCardProps {
  user: User
}

export function MembershipCard({ user }: MembershipCardProps) {
  const getTierIcon = (tier: string) => {
    switch (tier) {
      case "Platinum":
        return <Crown className="h-5 w-5 text-purple-500" />
      case "Gold":
        return <Crown className="h-5 w-5 text-yellow-500" />
      case "Silver":
        return <Star className="h-5 w-5 text-gray-400" />
      default:
        return <Gift className="h-5 w-5 text-orange-500" />
    }
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "Platinum":
        return "bg-linear-to-r from-purple-500 to-purple-600"
      case "Gold":
        return "bg-linear-to-r from-yellow-500 to-yellow-600"
      case "Silver":
        return "bg-linear-to-r from-gray-400 to-gray-500"
      default:
        return "bg-linear-to-r from-orange-500 to-orange-600"
    }
  }

  const getNextTierProgress = () => {
    const tiers = { Bronze: 0, Silver: 1000, Gold: 2500, Platinum: 5000 }
    const currentTierSpent = tiers[user.membershipTier as keyof typeof tiers]
    const nextTiers = Object.entries(tiers).filter(([, amount]) => amount > currentTierSpent)

    if (nextTiers.length === 0) return { nextTier: null, progress: 100, needed: 0 }

    const [nextTier, nextTierAmount] = nextTiers[0]
    const progress = (user.totalSpent / nextTierAmount) * 100
    const needed = nextTierAmount - user.totalSpent

    return { nextTier, progress, needed }
  }

  const { nextTier, progress, needed } = getNextTierProgress()

  return (
    <Card className="overflow-hidden">
      <div className={`h-2 ${getTierColor(user.membershipTier)}`} />
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getTierIcon(user.membershipTier)}
            <CardTitle>{user.membershipTier} Member</CardTitle>
          </div>
          <Badge variant="secondary">{user.loyaltyPoints} points</Badge>
        </div>
        <CardDescription>
          Member since {new Date(user.joinDate).toLocaleDateString()}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground">Total Spent</div>
            <div className="font-semibold">${user.totalSpent.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Total Orders</div>
            <div className="font-semibold">{user.totalOrders}</div>
          </div>
        </div>

        {nextTier && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress to {nextTier}</span>
              <span>${needed} to go</span>
            </div>
            <Progress value={progress} className="h-2" aria-label={`Progress to ${nextTier}`} />
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          {user.membershipTier} members enjoy exclusive benefits and rewards
        </div>
      </CardContent>
    </Card>
  )
}
