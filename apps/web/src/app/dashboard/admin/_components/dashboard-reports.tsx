"use client"

import { FileBarChart, Star } from "lucide-react"
import { type ReactElement, useId } from "react"
import { Area, AreaChart, Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

type MonthPoint = Readonly<{ name: string; revenue: number }>
type ProductPoint = Readonly<{ name: string; sales: number }>

const EMPTY_STATE_CLASS =
  "flex h-[360px] w-full items-center justify-center text-sm text-muted-foreground" as const

function getRevenueSummary(data: ReadonlyArray<MonthPoint>): string {
  if (data.length === 0) return "No revenue data available."
  const values = data.map((d) => d.revenue)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const first = data[0]?.revenue ?? 0
  const last = data[data.length - 1]?.revenue ?? 0
  const trend = last > first ? "upward" : last < first ? "downward" : "flat"
  return `Gross revenue for the last ${data.length} months. Min $${min}, max $${max}. Overall ${trend} trend.`
}

function getTopProductsSummary(data: ReadonlyArray<ProductPoint>): string {
  if (data.length === 0) return "No product sales data available."
  const top = [...data].sort((a, b) => b.sales - a.sales)[0]
  return `Units sold for top products in the last period. Top product: ${top.name} with ${top.sales} units.`
}

const REVENUE: ReadonlyArray<MonthPoint> = [
  { name: "Jan", revenue: 42000 },
  { name: "Feb", revenue: 46000 },
  { name: "Mar", revenue: 52000 },
  { name: "Apr", revenue: 49000 },
  { name: "May", revenue: 58000 },
  { name: "Jun", revenue: 61000 },
] as const

const TOP_PRODUCTS: ReadonlyArray<ProductPoint> = [
  { name: "Headphones", sales: 1250 },
  { name: "Coffee Beans", sales: 980 },
  { name: "T-Shirt", sales: 860 },
  { name: "Fitness Watch", sales: 740 },
  { name: "Wallet", sales: 620 },
] as const

function RevenueCard({ data }: { readonly data: ReadonlyArray<MonthPoint> }): ReactElement {
  const gradientId = useId()
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileBarChart className="h-5 w-5" />
          Revenue
        </CardTitle>
        <CardDescription>Last 6 months gross revenue</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className={EMPTY_STATE_CLASS}>No revenue data available.</div>
        ) : (
          <ChartContainer
            config={{ revenue: { label: "Revenue", theme: { light: "#16a34a", dark: "#34d399" } } }}
            className="h-[360px] w-full mx-auto"
            ariaLabel="Revenue area chart"
            ariaDescription={getRevenueSummary(data)}
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={Array.from(data)}
                margin={{ top: 12, right: 16, left: 8, bottom: 8 }}
              >
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `$${v / 1000}k`}
                />
                <ChartTooltip
                  content={<ChartTooltipContent />}
                  formatter={(v) => [`$${v}`, "Revenue"]}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--color-revenue)"
                  fill={`url(#${gradientId})`}
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}

function TopProductsCard({ data }: { readonly data: ReadonlyArray<ProductPoint> }): ReactElement {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5" />
          Top Products
        </CardTitle>
        <CardDescription>Units sold (last 30 days)</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className={EMPTY_STATE_CLASS}>No product sales data available.</div>
        ) : (
          <ChartContainer
            config={{ sales: { label: "Units", theme: { light: "#2563eb", dark: "#60a5fa" } } }}
            className="h-[360px] w-full mx-auto"
            ariaLabel="Top products bar chart"
            ariaDescription={getTopProductsSummary(data)}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={Array.from(data)} margin={{ top: 12, right: 16, left: 8, bottom: 8 }}>
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={false}
                />
                <ChartTooltip
                  content={<ChartTooltipContent />}
                  formatter={(v) => [String(v), "Units"]}
                />
                <Bar dataKey="sales" radius={[6, 6, 0, 0]} fill="var(--color-sales)" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}

function ReportsList(): ReactElement {
  const reports: ReadonlyArray<Readonly<{ id: string; name: string; description: string }>> = [
    {
      id: "r1",
      name: "Sales by Product",
      description: "CSV export of product sales for the last 30 days",
    },
    { id: "r2", name: "Orders by Day", description: "Daily order count and revenue totals" },
    { id: "r3", name: "Customers", description: "New vs returning customers with LTV" },
  ] as const
  return (
    <Card>
      <CardHeader>
        <CardTitle>Reports</CardTitle>
        <CardDescription>Download structured data for analysis</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {reports.map((r) => (
            <div key={r.id} className="flex items-center justify-between rounded-md border p-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{r.name}</p>
                <p className="truncate text-xs text-muted-foreground">{r.description}</p>
              </div>
              <Button size="sm" disabled>
                Download
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Admin → Dashboard → Reports
 * Visual summaries plus ready-to-integrate report list.
 */
type DashboardReportsProps = Readonly<{
  revenue?: ReadonlyArray<MonthPoint>
  topProducts?: ReadonlyArray<ProductPoint>
}>
export function DashboardReports({
  revenue = REVENUE,
  topProducts = TOP_PRODUCTS,
}: DashboardReportsProps = {}): ReactElement {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <RevenueCard data={revenue} />
        <TopProductsCard data={topProducts} />
      </div>
      <ReportsList />
    </div>
  )
}
