"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@components/ui/table"
import type React from "react"
import { products } from "@/lib/admin-data"

const LOW_STOCK_THRESHOLD = 10 as const

type LowStockItem = Readonly<{ id: string; name: string; stock: number }>

/**
 * LowStockWidget: shows products with stock below a threshold.
 */
export function LowStockWidget(): React.ReactElement {
  const items: LowStockItem[] = products
    .filter((p) => typeof p.stock === "number" && p.stock < LOW_STOCK_THRESHOLD)
    .map((p) => ({ id: p.id, name: p.name, stock: p.stock }))
    .slice(0, 10)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Low stock ({items.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="text-sm text-muted-foreground">No low-stock products.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Stock</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="text-right">{item.stock}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
