import type React from "react"
import { PageHeader } from "@/app/dashboard/_components/page-header"
import { Section } from "@/app/dashboard/_components/section"
import { ProductForm } from "@/app/dashboard/admin/_components/product-form"
import { Button } from "@/components/ui/button"
import { links } from "@/lib/links"
import { AppLink } from "../../../../../../../../modules/shared/components/app-link"

/**
 * Admin → E-commerce → Products → Edit page.
 */
export default async function EditProductPage({
  params,
}: {
  readonly params: Promise<{ productId: string }>
}): Promise<React.ReactElement> {
  const { productId } = await params
  return (
    <Section>
      <PageHeader
        title="Edit Product"
        description="Update product details."
        actions={
          <AppLink href={links.getDashboardAdminEcommerceProductsRoute()}>
            <Button variant="outline">Back to Products</Button>
          </AppLink>
        }
      />
      <ProductForm productId={productId} />
    </Section>
  )
}
