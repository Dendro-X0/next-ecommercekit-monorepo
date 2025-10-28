"use client"

import { PieChart as PieChartIcon, TrendingUp } from "lucide-react"
import { type ReactElement, useId } from "react"
import { Area, AreaChart, Cell, Pie, PieChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface SpendingChartsProps {
  spendingData: Array<{ name: string; amount: number }>
  categoryData: Array<{ name: string; amount: number; percentage: number }>
}

// Theme-aware categorical palette (good contrast)
const LIGHT_PALETTE = ["#2563eb", "#16a34a", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"] as const
const DARK_PALETTE = ["#60a5fa", "#34d399", "#fbbf24", "#f87171", "#a78bfa", "#22d3ee"] as const
const getCategoryColorVar = (index: number): string =>
  `var(--color-c${((index % 6) + 1) as number})`

/**
 * User dashboard charts with accessible colors and responsive sizing.
 */
export function SpendingCharts({ spendingData, categoryData }: SpendingChartsProps): ReactElement {
  const gradientId: string = useId()
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Monthly Spending Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Monthly Spending
          </CardTitle>
          <CardDescription>Your spending pattern over the last 12 months</CardDescription>
        </CardHeader>
        <CardContent>
          {/* SR-only summary for screen readers */}
          <p className="sr-only">
            Monthly spending total: $
            {spendingData.reduce((sum, it) => sum + it.amount, 0).toFixed(2)} across{" "}
            {spendingData.length} months.
          </p>
          <ChartContainer
            config={{
              amount: {
                label: "Amount",
                theme: { light: "#2563eb", dark: "#60a5fa" },
              },
            }}
            className="h-[360px] w-full mx-auto"
            ariaLabel="Monthly spending area chart"
            ariaDescription="Area chart showing your spending over the last twelve months in US dollars"
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={spendingData} margin={{ top: 12, right: 16, left: 8, bottom: 8 }}>
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-amount)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="var(--color-amount)" stopOpacity={0.1} />
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
                  tickFormatter={(value) => `$${value}`}
                />
                <ChartTooltip
                  content={<ChartTooltipContent />}
                  formatter={(value: number | string) => [`$${value}`, "Spent"]}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="var(--color-amount)"
                  fillOpacity={1}
                  fill={`url(#${gradientId})`}
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChartIcon className="h-5 w-5" />
            Spending by Category
          </CardTitle>
          <CardDescription>Where you spend your money most</CardDescription>
        </CardHeader>
        <CardContent>
          {/* SR-only summary for category breakdown */}
          <div className="sr-only">
            <p>Spending by category summary:</p>
            <ul>
              {categoryData.map((c) => (
                <li key={c.name}>
                  {c.name}: ${c.amount} ({c.percentage}%)
                </li>
              ))}
            </ul>
          </div>
          <ChartContainer
            config={{
              // Define six categorical colors exposed as CSS vars --color-c1..--color-c6
              c1: { theme: { light: LIGHT_PALETTE[0], dark: DARK_PALETTE[0] } },
              c2: { theme: { light: LIGHT_PALETTE[1], dark: DARK_PALETTE[1] } },
              c3: { theme: { light: LIGHT_PALETTE[2], dark: DARK_PALETTE[2] } },
              c4: { theme: { light: LIGHT_PALETTE[3], dark: DARK_PALETTE[3] } },
              c5: { theme: { light: LIGHT_PALETTE[4], dark: DARK_PALETTE[4] } },
              c6: { theme: { light: LIGHT_PALETTE[5], dark: DARK_PALETTE[5] } },
            }}
            className="h-[360px] w-full mx-auto"
            ariaLabel="Spending by category donut chart"
            ariaDescription="Donut chart showing spending by category with amounts in US dollars and percentages"
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="amount"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${entry.name}`} fill={getCategoryColorVar(index)} />
                  ))}
                </Pie>
                <ChartTooltip
                  content={<ChartTooltipContent />}
                  formatter={(value, _name, item) => {
                    const payload =
                      item && typeof item === "object" && "payload" in item
                        ? (item as { payload?: { percentage?: number; name?: string } }).payload
                        : undefined
                    const percent = payload?.percentage ?? 0
                    const name = payload?.name ?? ""
                    return [`$${value} (${percent}%)`, name]
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
          <div className="mt-4 space-y-2">
            {categoryData.map((category, index) => (
              <div key={category.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: getCategoryColorVar(index) }}
                  />
                  <span>{category.name}</span>
                </div>
                <span className="font-medium">${category.amount}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
