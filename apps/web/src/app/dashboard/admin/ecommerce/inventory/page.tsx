import type React from "react"
import { PageHeader } from "@/app/dashboard/_components/page-header"
import { Section } from "@/app/dashboard/_components/section"
import { EcommerceInventory } from "@/app/dashboard/admin/_components/ecommerce-inventory"
import { InventoryCsvImport } from "@/app/dashboard/admin/_components/inventory-csv-import"
import { LowStockWidget } from "@/app/dashboard/admin/_components/low-stock-widget"

/**
 * Admin → E-commerce → Inventory page.
 */
export default function InventoryPage(): React.ReactElement {
  return (
    <Section>
      <PageHeader
        title="Inventory"
        description="Monitor stock levels, identify low-stock items, and preview CSV imports."
      />

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 grid gap-6">
          <EcommerceInventory />
          <InventoryCsvImport />
        </div>
        <div className="grid gap-6">
          <LowStockWidget />
        </div>
      </div>
    </Section>
  )
}
