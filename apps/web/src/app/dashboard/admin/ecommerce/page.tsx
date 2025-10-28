import { redirect } from "next/navigation"
import { links } from "@/lib/links"

/**
 * AdminEcommerceIndexPage
 * Redirects `/dashboard/admin/ecommerce` to the Products list.
 */
export default function AdminEcommerceIndexPage(): never {
  redirect(links.getDashboardAdminEcommerceProductsRoute())
}
