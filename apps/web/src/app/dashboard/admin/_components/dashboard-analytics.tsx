"use client"

import { Activity, Users } from "lucide-react"
import type { ReactElement } from "react"
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

type SeriesPoint = Readonly<{ name: string; value: number }>
type ChannelPoint = Readonly<{ name: string; value: number }>

const EMPTY_STATE_CLASS =
  "flex h-[360px] w-full items-center justify-center text-sm text-muted-foreground" as const

function getTrafficSummary(data: ReadonlyArray<SeriesPoint>): string {
  if (data.length === 0) return "No traffic data available."
  const values = data.map((d) => d.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const first = data[0]?.value ?? 0
  const last = data[data.length - 1]?.value ?? 0
  const trend = last > first ? "upward" : last < first ? "downward" : "flat"
  return `Unique visitors per month. Min ${min}, max ${max}. Overall ${trend} trend.`
}

function getChannelsSummary(data: ReadonlyArray<ChannelPoint>): string {
  if (data.length === 0) return "No channel data available."
  const top = [...data].sort((a, b) => b.value - a.value)[0]
  return `Share of sessions by channel. Top channel is ${top.name} at ${top.value} percent.`
}

const TRAFFIC: ReadonlyArray<SeriesPoint> = [
  { name: "Jan", value: 8200 },
  { name: "Feb", value: 9100 },
  { name: "Mar", value: 12000 },
  { name: "Apr", value: 10500 },
  { name: "May", value: 13400 },
  { name: "Jun", value: 14200 },
  { name: "Jul", value: 15100 },
  { name: "Aug", value: 16300 },
  { name: "Sep", value: 17100 },
  { name: "Oct", value: 16800 },
  { name: "Nov", value: 18200 },
  { name: "Dec", value: 19500 },
] as const

const CHANNELS: ReadonlyArray<ChannelPoint> = [
  { name: "Organic", value: 48 },
  { name: "Paid", value: 22 },
  { name: "Email", value: 12 },
  { name: "Social", value: 10 },
  { name: "Referral", value: 8 },
] as const

function TrafficCard({ data }: { readonly data: ReadonlyArray<SeriesPoint> }): ReactElement {
  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50 overflow-hidden group">
      <div className="h-1 w-full bg-linear-to-r from-blue-500 to-cyan-500 opacity-50 group-hover:opacity-100 transition-opacity" />
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-blue-500" />
          Traffic Trend
        </CardTitle>
        <CardDescription>Monthly unique visitors analysis</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className={`${EMPTY_STATE_CLASS} flex-col gap-2`}>
            <Activity className="h-8 w-8 opacity-20" />
            <span>No traffic data available.</span>
          </div>
        ) : (
          <ChartContainer
            config={{
              visitors: { label: "Visitors", theme: { light: "#2563eb", dark: "#60a5fa" } },
            }}
            className="h-[360px] w-full mx-auto"
            ariaLabel="Traffic line chart"
            ariaDescription={getTrafficSummary(data)}
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={Array.from(data)}
                margin={{ top: 12, right: 16, left: 8, bottom: 8 }}
              >
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
                  cursor={{ stroke: "var(--color-visitors)", strokeWidth: 1, strokeDasharray: "4 4" }}
                  content={<ChartTooltipContent />}
                  formatter={(v) => [String(v), "Visitors"]}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="var(--color-visitors)"
                  strokeWidth={3}
                  activeDot={{ r: 6, strokeWidth: 0, fill: "var(--color-visitors)" }}
                  dot={{ r: 3, fill: "var(--color-visitors)", strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}

function ChannelsCard({ data }: { readonly data: ReadonlyArray<ChannelPoint> }): ReactElement {
  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50 overflow-hidden group">
      <div className="h-1 w-full bg-linear-to-r from-purple-500 to-pink-500 opacity-50 group-hover:opacity-100 transition-opacity" />
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-purple-500" />
          Acquisition Channels
        </CardTitle>
        <CardDescription>Share of sessions by source</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className={EMPTY_STATE_CLASS}>No channel data available.</div>
        ) : (
          <ChartContainer
            config={{
              organic: { theme: { light: "#16a34a", dark: "#34d399" } },
              paid: { theme: { light: "#2563eb", dark: "#60a5fa" } },
              email: { theme: { light: "#f59e0b", dark: "#fbbf24" } },
              social: { theme: { light: "#8b5cf6", dark: "#a78bfa" } },
              referral: { theme: { light: "#06b6d4", dark: "#22d3ee" } },
            }}
            className="h-[360px] w-full mx-auto"
            ariaLabel="Traffic by channel bar chart"
            ariaDescription={getChannelsSummary(data)}
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
                  tickFormatter={(v) => `${v}%`}
                  tickLine={false}
                  axisLine={false}
                />
                <ChartTooltip
                  content={<ChartTooltipContent />}
                  formatter={(v, _n, item) => [
                    `${v}%`,
                    (item?.payload as ChannelPoint | undefined)?.name ?? "",
                  ]}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="var(--color-organic)" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Admin → Dashboard → Analytics
 * Minimal, accessible charts ready for data integration.
 */
type DashboardAnalyticsProps = Readonly<{
  traffic?: ReadonlyArray<SeriesPoint>
  channels?: ReadonlyArray<ChannelPoint>
}>
export function DashboardAnalytics({
  traffic = TRAFFIC,
  channels = CHANNELS,
}: DashboardAnalyticsProps = {}): ReactElement {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <TrafficCard data={traffic} />
      <ChannelsCard data={channels} />
    </div>
  )
}
