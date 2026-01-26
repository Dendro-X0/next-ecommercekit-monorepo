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
  const totalSpending: number = Array.isArray(spendingData)
    ? spendingData.reduce((sum, it) => sum + (it?.amount ?? 0), 0)
    : 0

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Monthly Spending Trend */}
      <Card className="bg-card/50 backdrop-blur-md border-border/50 overflow-hidden group">
        <div className="h-1 w-full bg-linear-to-r from-blue-500 to-cyan-500 opacity-50 group-hover:opacity-100 transition-opacity" />
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            Spending Trend
          </CardTitle>
          <CardDescription>Visualizing your cash flow over the year</CardDescription>
        </CardHeader>
        <CardContent>
          {totalSpending === 0 ? (
            <div className="h-[360px] flex flex-col items-center justify-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
              <TrendingUp className="h-10 w-10 mb-4 opacity-20" />
              <p className="text-sm font-medium">No spending data yet</p>
            </div>
          ) : (
            <ChartContainer
              config={{
                amount: {
                  label: "Spent",
                  theme: { light: "#3b82f6", dark: "#60a5fa" },
                },
              }}
              className="h-[360px] w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={spendingData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-amount)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--color-amount)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fontWeight: 500, fill: "hsl(var(--muted-foreground))" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fontWeight: 500, fill: "hsl(var(--muted-foreground))" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <ChartTooltip
                    cursor={{ stroke: "var(--color-amount)", strokeWidth: 1, strokeDasharray: "4 4" }}
                    content={<ChartTooltipContent />}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="var(--color-amount)"
                    fillOpacity={1}
                    fill={`url(#${gradientId})`}
                    strokeWidth={2}
                    activeDot={{ r: 4, strokeWidth: 0, fill: "var(--color-amount)" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <Card className="bg-card/50 backdrop-blur-md border-border/50 overflow-hidden group">
        <div className="h-1 w-full bg-linear-to-r from-purple-500 to-pink-500 opacity-50 group-hover:opacity-100 transition-opacity" />
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <PieChartIcon className="h-5 w-5 text-purple-500" />
            Budget Distribution
          </CardTitle>
          <CardDescription>Breaking down your spending habits</CardDescription>
        </CardHeader>
        <CardContent>
          {categoryData.length === 0 ? (
            <div className="h-[360px] flex flex-col items-center justify-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
              <PieChartIcon className="h-10 w-10 mb-4 opacity-20" />
              <p className="text-sm font-medium">Add orders to see breakdown</p>
            </div>
          ) : (
            <>
              <ChartContainer
                config={{
                  c1: { theme: { light: LIGHT_PALETTE[0], dark: DARK_PALETTE[0] } },
                  c2: { theme: { light: LIGHT_PALETTE[1], dark: DARK_PALETTE[1] } },
                  c3: { theme: { light: LIGHT_PALETTE[2], dark: DARK_PALETTE[2] } },
                  c4: { theme: { light: LIGHT_PALETTE[3], dark: DARK_PALETTE[3] } },
                  c5: { theme: { light: LIGHT_PALETTE[4], dark: DARK_PALETTE[4] } },
                  c6: { theme: { light: LIGHT_PALETTE[5], dark: DARK_PALETTE[5] } },
                }}
                className="h-[300px] w-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={Array.isArray(categoryData) ? categoryData : []}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="amount"
                      stroke="none"
                    >
                      {Array.isArray(categoryData) && categoryData.filter(Boolean).map((entry, index) => (
                        <Cell key={`cell-${entry.name}`} fill={getCategoryColorVar(index)} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4">
                {categoryData.map((category, index) => (
                  <div key={category.name} className="flex items-center justify-between p-2 rounded-lg bg-background/30 border border-border/30">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: getCategoryColorVar(index) }}
                      />
                      <span className="text-[11px] font-semibold truncate">{category.name}</span>
                    </div>
                    <span className="text-[11px] font-bold">${category.amount}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
