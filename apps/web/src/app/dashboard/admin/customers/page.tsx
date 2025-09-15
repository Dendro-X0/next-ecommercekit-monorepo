import type React from "react"
import { PageHeader } from "@/app/dashboard/_components/page-header"
import { Section } from "@/app/dashboard/_components/section"
import { CustomersTable } from "@/app/dashboard/admin/_components/customers-table"

export default function CustomersPage(): React.ReactElement {
  return (
    <Section>
      <PageHeader title="Customers" description="Manage your customer records and activity." />
      <CustomersTable />
    </Section>
  )
}
