"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { BarChart3, CheckCircle2, Copy, Link as LinkIcon, RefreshCw } from "lucide-react"
import type React from "react"
import { useMemo } from "react"
import { DashboardHeader } from "@/app/dashboard/user/_components/dashboard-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { SidebarInset } from "@/components/ui/sidebar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { AFFILIATE_CLICKS_QK, AFFILIATE_ME_QK } from "@/lib/affiliate/query-keys"
import { affiliateApi } from "@/lib/data/affiliate"
import { links } from "@/lib/links"

/**
 * User → Affiliate page (frontend-only)
 */
export default function Page(): React.ReactElement {
  const qc = useQueryClient()
  const { data: me, isLoading: meLoading } = useQuery({
    queryKey: AFFILIATE_ME_QK,
    queryFn: affiliateApi.getMe,
  })
  const { data: clicks, isLoading: _clicksLoading } = useQuery({
    queryKey: AFFILIATE_CLICKS_QK,
    queryFn: affiliateApi.listClicks,
  })
  const code: string | undefined = me?.profile.code
  const referralLink: string = useMemo(() => {
    const base: string =
      typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"
    const url: URL = new URL(links.getShopHomeRoute(), base)
    if (code) url.searchParams.set("ref", code)
    return url.toString()
  }, [code])

  const onCopy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(referralLink)
    } catch {
      /* no-op */
    }
  }

  const regen = useMutation({
    mutationFn: affiliateApi.regenerateCode,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: AFFILIATE_ME_QK })
    },
  })
  const onRegenerate = (): void => {
    regen.mutate()
  }

  const breadcrumbs = [{ label: "Dashboard", href: "/dashboard/user" }, { label: "Affiliate" }]

  return (
    <SidebarInset>
      <DashboardHeader title="Affiliate" breadcrumbs={breadcrumbs} />
      <div className="flex-1 space-y-6 p-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Referral Code</CardTitle>
              <LinkIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="flex items-center gap-2">
              <Badge variant="outline">{code ?? "-"}</Badge>
              <Button
                size="sm"
                variant="outline"
                onClick={onRegenerate}
                disabled={regen.isPending || meLoading}
              >
                <RefreshCw className="mr-2 h-4 w-4" /> Regenerate
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{me?.stats.totalClicks ?? 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversions</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{me?.stats.conversions ?? 0}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your Referral Link</CardTitle>
            <CardDescription>
              Share this link with your audience to earn commissions.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 md:flex-row md:items-center">
            <Input readOnly value={referralLink} className="flex-1" />
            <Button
              className="md:w-auto"
              onClick={onCopy}
              variant="outline"
              disabled={!code || meLoading}
            >
              <Copy className="mr-2 h-4 w-4" /> Copy
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Clicks</CardTitle>
            <CardDescription>Latest activity from your referral link.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Commission</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(clicks ?? []).map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>{new Date(c.date).toLocaleString()}</TableCell>
                    <TableCell>{c.source ?? "-"}</TableCell>
                    <TableCell>-</TableCell>
                    <TableCell>
                      <Badge variant="secondary">-</Badge>
                    </TableCell>
                    <TableCell className="text-right">-</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </SidebarInset>
  )
}
