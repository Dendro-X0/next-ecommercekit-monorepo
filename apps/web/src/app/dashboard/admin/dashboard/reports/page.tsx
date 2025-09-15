"use client"

import dynamic from "next/dynamic"
import type React from "react"
import { PageHeader } from "@/app/dashboard/_components/page-header"
import { Section } from "@/app/dashboard/_components/section"

const DashboardReports = dynamic(
  async () => {
    const mod = await import("@/app/dashboard/admin/_components/dashboard-reports")
    return { default: mod.DashboardReports }
  },
  {
    ssr: false,
    loading: () => (
      <div className="grid gap-6 md:grid-cols-2">
        <div className="h-[360px]" />
        <div className="h-[360px]" />
      </div>
    ),
  },
)

export default function ReportsPage(): React.ReactElement {
  return (
    <Section>
      <PageHeader title="Reports" description="Download and view operational reports." />
      <DashboardReports />
    </Section>
  )
}
