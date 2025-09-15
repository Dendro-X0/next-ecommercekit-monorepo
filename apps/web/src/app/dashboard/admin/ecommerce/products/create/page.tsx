import type React from "react"
import { PageHeader } from "@/app/dashboard/_components/page-header"
import { Section } from "@/app/dashboard/_components/section"
import { ProductForm } from "@/app/dashboard/admin/_components/product-form"
import { Button } from "@/components/ui/button"
import { links } from "@/lib/links"
import { AppLink } from "../../../../../../../modules/shared/components/app-link"

/**
 * Admin → E-commerce → Products → Create page.
 */
export default function CreateProductPage(): React.ReactElement {
  return (
    <Section>
      <PageHeader
        title="Create Product"
        description="Add a new product to your catalog."
        actions={
          <AppLink href={links.getDashboardAdminEcommerceProductsRoute()}>
            <Button variant="outline">Back to Products</Button>
          </AppLink>
        }
      />
      <ProductForm />
    </Section>
  )
}
