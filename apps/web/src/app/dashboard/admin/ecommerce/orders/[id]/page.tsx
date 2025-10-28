import { Badge } from "@components/ui/badge"
import { Button } from "@components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@components/ui/table"
import NextImage from "next/image"
import type React from "react"
import { DashboardEmptyState } from "@/app/dashboard/_components/empty-state"
import { PageHeader } from "@/app/dashboard/_components/page-header"
import { Section } from "@/app/dashboard/_components/section"
import { orders, products } from "@/lib/admin-data"
import { links } from "@/lib/links"
import { AppLink } from "../../../../../../../modules/shared/components/app-link"

/**
 * Admin → E-commerce → Orders → Detail page.
 */
export default function OrderDetailPage({
  params,
}: {
  readonly params: { readonly id: string }
}): React.ReactElement {
  const orderId: string = params.id
  const order = orders.find((o) => o.id === orderId)
  type OrderLine = {
    readonly id: string
    readonly name: string
    readonly quantity: number
    readonly unitPrice: string // keeping as formatted currency for mock parity
    readonly total: string
    readonly image: string
  }

  const buildOrderLines = (itemsCount: number): OrderLine[] => {
    const count: number = Math.max(1, itemsCount)
    const sample = products.slice(0, count)
    return sample.map(
      (p): OrderLine => ({
        id: p.id,
        name: p.name,
        quantity: 1,
        unitPrice: p.price,
        total: p.price,
        image: p.image,
      }),
    )
  }

  if (!order) {
    return (
      <Section>
        <PageHeader
          title="Order not found"
          description="We couldn't find that order."
          actions={
            <AppLink href={links.getDashboardAdminEcommerceOrdersRoute()}>
              <Button variant="outline">Back to Orders</Button>
            </AppLink>
          }
        />
        <DashboardEmptyState
          title="No order"
          description="The requested order ID does not exist in the current dataset."
          variant="no-results"
          primaryAction={
            <AppLink href={links.getDashboardAdminEcommerceOrdersRoute()}>
              <Button variant="outline">Go to Orders</Button>
            </AppLink>
          }
        />
      </Section>
    )
  }

  return (
    <Section>
      <PageHeader
        title={`Order ${order.id}`}
        description={`${order.items} item${order.items !== 1 ? "s" : ""} • Placed on ${order.date}`}
        actions={
          <AppLink href={links.getDashboardAdminEcommerceOrdersRoute()}>
            <Button variant="outline">Back to Orders</Button>
          </AppLink>
        }
      />

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Customer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div className="font-medium">{order.customer}</div>
            <div className="text-muted-foreground">{order.email}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            <div>
              <span className="text-muted-foreground mr-2">Fulfillment:</span>
              <Badge>{order.status}</Badge>
            </div>
            <div>
              <span className="text-muted-foreground mr-2">Payment:</span>
              <Badge variant="secondary">{order.paymentStatus}</Badge>
            </div>
            <div>
              <span className="text-muted-foreground mr-2">Total:</span>
              <span className="font-medium">{order.total}</span>
            </div>
            <div>
              <span className="text-muted-foreground mr-2">Date:</span>
              <span>{order.date}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Items */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Image</TableHead>
                <TableHead>Item</TableHead>
                <TableHead className="w-[80px]">Qty</TableHead>
                <TableHead className="w-[140px]">Unit price</TableHead>
                <TableHead className="w-[140px]">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {buildOrderLines(order.items).map((line) => (
                <TableRow key={line.id}>
                  <TableCell>
                    <div className="relative h-12 w-12 rounded-md overflow-hidden">
                      <NextImage
                        src={`${line.image || "/placeholder.svg"}?height=48&width=48`}
                        alt={line.name}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{line.name}</div>
                    <div className="text-sm text-muted-foreground">{line.id}</div>
                  </TableCell>
                  <TableCell>{line.quantity}</TableCell>
                  <TableCell>{line.unitPrice}</TableCell>
                  <TableCell className="font-medium">{line.total}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Section>
  )
}
