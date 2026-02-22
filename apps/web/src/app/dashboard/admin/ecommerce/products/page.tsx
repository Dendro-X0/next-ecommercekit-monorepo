import type React from "react"
import { PageHeader } from "@/app/dashboard/_components/page-header"
import { Section } from "@/app/dashboard/_components/section"
import { ProductsTable } from "@/app/dashboard/admin/_components/products-table"
<<<<<<< HEAD
import { Button } from "@/components/ui/button"
import { links } from "@/lib/links"
import { AppLink } from "../../../../../../modules/shared/components/app-link"
=======
>>>>>>> 6f36ebc (Updated to v 1.2.1)

/**
 * Admin → E-commerce → Products list page.
 */
export default function ProductsPage(): React.ReactElement {
  return (
    <Section>
      <PageHeader
        title="Products"
        description="Manage your catalog. Create, edit, and organize products."
<<<<<<< HEAD
        actions={
          <AppLink href={links.getDashboardAdminEcommerceProductCreateRoute()}>
            <Button>Create Product</Button>
          </AppLink>
        }
=======
>>>>>>> 6f36ebc (Updated to v 1.2.1)
      />
      <ProductsTable />
    </Section>
  )
}
