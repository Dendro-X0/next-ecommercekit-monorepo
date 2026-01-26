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

  const getTierGradient = (tier: string) => {
    switch (tier) {
      case "Platinum":
        return "from-purple-500/20 via-purple-500/10 to-transparent"
      case "Gold":
        return "from-yellow-500/20 via-yellow-500/10 to-transparent"
      case "Silver":
        return "from-slate-400/20 via-slate-400/10 to-transparent"
      default:
        return "from-orange-500/20 via-orange-500/10 to-transparent"
    }
  }

  const { nextTier, progress, needed } = getNextTierProgress()

  return (
    <Card className="overflow-hidden border-border/50 bg-card/30 backdrop-blur-md relative">
      <div className={`absolute inset-0 bg-linear-to-br ${getTierGradient(user.membershipTier)} pointer-events-none`} />
      <div className={`h-1.5 w-full ${getTierColor(user.membershipTier)}`} />
      <CardHeader className="relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl bg-background/50 border border-border/50 shadow-sm`}>
              {getTierIcon(user.membershipTier)}
            </div>
            <div>
              <CardTitle className="text-xl font-bold tracking-tight">{user.membershipTier} Member</CardTitle>
              <CardDescription className="text-xs font-medium uppercase tracking-wider">
                Since {new Date(user.joinDate).toLocaleDateString()}
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="bg-background/50 border-primary/20 text-primary font-bold px-3 py-1">
            {user.loyaltyPoints.toLocaleString()} <span className="ml-1 font-medium text-[10px] uppercase opacity-70">pts</span>
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 relative z-10">
        <div className="grid grid-cols-2 gap-8 py-2">
          <div className="space-y-1">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Total Investment</div>
            <div className="text-2xl font-bold tracking-tight">${user.totalSpent.toLocaleString()}</div>
          </div>
          <div className="space-y-1 text-right">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Orders Placed</div>
            <div className="text-2xl font-bold tracking-tight">{user.totalOrders}</div>
          </div>
        </div>

        {nextTier && (
          <div className="space-y-3 bg-background/40 p-4 rounded-2xl border border-border/50">
            <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
              <span className="text-muted-foreground">Next Tier: <span className="text-foreground">{nextTier}</span></span>
              <span className="text-primary">${needed.toLocaleString()} to go</span>
            </div>
            <div className="relative">
              <Progress value={progress} className="h-2.5 bg-background shadow-inner" aria-label={`Progress to ${nextTier}`} />
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-primary/80 bg-primary/5 w-fit px-3 py-1 rounded-full">
          <Star className="h-3 w-3 fill-current" />
          Exclusive Rewards Active
        </div>
      </CardContent>
    </Card>
  )
}
