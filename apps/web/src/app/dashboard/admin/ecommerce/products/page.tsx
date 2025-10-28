import type React from "react"
import { PageHeader } from "@/app/dashboard/_components/page-header"
import { Section } from "@/app/dashboard/_components/section"
import { ProductsTable } from "@/app/dashboard/admin/_components/products-table"
import { Button } from "@/components/ui/button"
import { links } from "@/lib/links"
import { AppLink } from "../../../../../../modules/shared/components/app-link"

/**
 * Admin → E-commerce → Products list page.
 */
export default function ProductsPage(): React.ReactElement {
  return (
    <Section>
      <PageHeader
        title="Products"
        description="Manage your catalog. Create, edit, and organize products."
        actions={
          <AppLink href={links.getDashboardAdminEcommerceProductCreateRoute()}>
            <Button>Create Product</Button>
          </AppLink>
        }
      />
      <ProductsTable />
    </Section>
  )
}
