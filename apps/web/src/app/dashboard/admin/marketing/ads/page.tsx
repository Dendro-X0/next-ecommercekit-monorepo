import { Search } from "lucide-react"
import type React from "react"
import { DashboardEmptyState } from "@/app/dashboard/_components/empty-state"
import { PageHeader } from "@/app/dashboard/_components/page-header"
import { Section } from "@/app/dashboard/_components/section"
import { Toolbar } from "@/app/dashboard/_components/toolbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

/**
 * Admin → Marketing → Ads
 */
export default function Page(): React.ReactElement {
  return (
    <Section>
      <PageHeader title="Ads" description="Create and manage advertisements and placements." />

      <Toolbar className="mt-2 flex w-full flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search ads..." className="pl-8 w-full" disabled />
          </div>
          <Select disabled>
            <SelectTrigger className="w-full md:w-40">
              <SelectValue placeholder="All placements" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All placements</SelectItem>
              <SelectItem value="homepage">Homepage</SelectItem>
              <SelectItem value="product">Product Page</SelectItem>
              <SelectItem value="checkout">Checkout</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" disabled>
            New Placement
          </Button>
          <Button disabled>New Ad</Button>
        </div>
      </Toolbar>

      <DashboardEmptyState
        title="No ads yet"
        description="Set up ad placements and creatives to start running campaigns and tracking performance."
        primaryAction={<Button disabled>New Ad</Button>}
        secondaryAction={
          <Button variant="outline" disabled>
            New Placement
          </Button>
        }
      />
    </Section>
  )
}
