import type React from "react"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { PageHeader } from "@/app/dashboard/_components/page-header"
import { Section } from "@/app/dashboard/_components/section"
import { ProductForm } from "@/app/dashboard/admin/_components/product-form"
import { Button } from "@/components/ui/button"
import { links } from "@/lib/links"
import { AppLink } from "../../../../../../../modules/shared/components/app-link"

function buildBaseUrl(h: { get(name: string): string | null }): string {
  const envBase = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL
  if (envBase && typeof envBase === "string" && envBase.length > 0) return envBase
  const proto = h.get("x-forwarded-proto") || (process.env.NODE_ENV === "development" ? "http" : "https")
  const host = h.get("x-forwarded-host") || h.get("host")
  if (host) return `${proto}://${host}`
  return "http://localhost:3000"
}

async function ensureCatalogWriteCapable(): Promise<void> {
  const h = await headers()
  const base = buildBaseUrl(h)
  const cookie = h.get("cookie") || ""
  const reqHeaders = new Headers()
  if (cookie) reqHeaders.set("cookie", cookie)
  reqHeaders.set("accept", "application/json")
  try {
    const res = await fetch(`${base}/api/v1/admin/catalog-meta`, {
      method: "GET",
      headers: reqHeaders,
      cache: "no-store",
      next: { revalidate: 0 },
    })
    if (!res.ok) return
    const data = (await res.json()) as { readonly supportsWrite?: unknown }
    if (data?.supportsWrite === false) {
      redirect(links.getDashboardAdminEcommerceProductsRoute())
    }
  } catch {
    return
  }
}

/**
 * Admin → E-commerce → Products → Create page.
 */
export default async function CreateProductPage(): Promise<React.ReactElement> {
  await ensureCatalogWriteCapable()
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
