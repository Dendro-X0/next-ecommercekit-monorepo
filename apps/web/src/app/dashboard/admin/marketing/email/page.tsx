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
 * Admin → Marketing → Email Marketing (frontend-only scaffold)
 * Minimal, accessible UI ready for future integration.
 */
export default function Page(): React.ReactElement {
  return (
    <Section>
      <PageHeader
        title="Email Marketing"
        description="Design and send email campaigns, newsletters, and automations."
      />

      <Toolbar className="mt-2 flex w-full flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search campaigns..." className="pl-8 w-full" disabled />
          </div>
          <Select disabled>
            <SelectTrigger className="w-full md:w-40">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" disabled>
            Import
          </Button>
          <Button disabled>New Campaign</Button>
        </div>
      </Toolbar>

      <DashboardEmptyState
        title="No campaigns yet"
        description="Create your first email campaign to start engaging customers."
        primaryAction={<Button disabled>New Campaign</Button>}
        secondaryAction={
          <Button variant="outline" disabled>
            Import
          </Button>
        }
      />
    </Section>
  )
}
