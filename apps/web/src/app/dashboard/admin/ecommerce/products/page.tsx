import type React from "react"
import { PageHeader } from "@/app/dashboard/_components/page-header"
import { Section } from "@/app/dashboard/_components/section"
import { ProductsTable } from "@/app/dashboard/admin/_components/products-table"

/**
 * Admin → E-commerce → Products list page.
 */
export default function ProductsPage(): React.ReactElement {
  return (
    <Section>
      <PageHeader
        title="Products"
        description="Manage your catalog. Create, edit, and organize products."
      />
      <ProductsTable />
    </Section>
  )
}
