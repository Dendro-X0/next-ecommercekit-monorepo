"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { CheckCircle2, DollarSign, Search } from "lucide-react"
import type { JSX } from "react"
import { useEffect, useMemo, useState } from "react"
import { PageHeader } from "@/app/dashboard/_components/page-header"
import { Section } from "@/app/dashboard/_components/section"
import { Toolbar } from "@/app/dashboard/_components/toolbar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ADMIN_AFFILIATE_CONVERSIONS_FILTERED_QK } from "@/lib/admin/affiliate/query-keys"
import { type AdminAffiliateConversion, adminApi } from "@/lib/data/admin-api"
import { showToast } from "@/lib/utils/toast"
import { AppLink } from "../../../../../../modules/shared/components/app-link"

/**
 * Admin → Marketing → Affiliate
 */
/**
 * Admin → Marketing → Affiliate
 * Lists affiliate conversions and allows status moderation.
 */
export default function Page(): JSX.Element {
  const [search, setSearch] = useState<string>("")
  const [status, setStatus] = useState<"all" | AdminAffiliateConversion["status"]>("all")
  const queryClient = useQueryClient()
  const [confirmOpen, setConfirmOpen] = useState<boolean>(false)
  const [pendingAction, setPendingAction] = useState<Readonly<{
    id: string
    next: AdminAffiliateConversion["status"]
  }> | null>(null)
  // Stable keys for skeleton rows
  const skeletonKeys = useMemo<readonly string[]>(
    () => Array.from({ length: 5 }, (_v, i) => `aff-skel-${i}`),
    [],
  )

  const { data, isLoading, error } = useQuery<
    Readonly<{ items: readonly AdminAffiliateConversion[] }>
  >({
    queryKey: ADMIN_AFFILIATE_CONVERSIONS_FILTERED_QK(status),
    queryFn: (): Promise<Readonly<{ items: readonly AdminAffiliateConversion[] }>> =>
      adminApi.listAffiliateConversions({
        status: status === "all" ? undefined : status,
        limit: 100,
      }),
    staleTime: 30_000,
  })
  const items: readonly AdminAffiliateConversion[] = data?.items ?? []

  useEffect(() => {
    if (error) {
      const message: string =
        error instanceof Error ? error.message : "Failed to load affiliate conversions"
      showToast(message, { type: "error" })
    }
  }, [error])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return items
    return items.filter(
      (x) =>
        x.id.toLowerCase().includes(term) ||
        x.orderId.toLowerCase().includes(term) ||
        x.code.toLowerCase().includes(term),
    )
  }, [items, search])

  type ListData = Readonly<{ items: readonly AdminAffiliateConversion[] }>
  const ALL_STATUSES = ["all", "pending", "approved", "paid"] as const

  function getCachedList(s: (typeof ALL_STATUSES)[number]): ListData | undefined {
    return queryClient.getQueryData<ListData>(ADMIN_AFFILIATE_CONVERSIONS_FILTERED_QK(s))
  }

  function setCachedList(s: (typeof ALL_STATUSES)[number], data: ListData): void {
    queryClient.setQueryData<ListData>(ADMIN_AFFILIATE_CONVERSIONS_FILTERED_QK(s), data)
  }

  function buildUpdatedItem(
    id: string,
    next: AdminAffiliateConversion["status"],
  ): AdminAffiliateConversion | null {
    const sources: Array<ListData | undefined> = ALL_STATUSES.map(getCachedList)
    const found = sources.find((d) => d?.items.some((x) => x.id === id))
    const original = found?.items.find((x) => x.id === id) ?? null
    if (!original) return null
    return {
      ...original,
      status: next,
      paidAt: next === "paid" ? new Date().toISOString() : null,
    } as AdminAffiliateConversion
  }

  function applyOptimistic(
    id: string,
    next: AdminAffiliateConversion["status"],
  ): Record<string, ListData | undefined> {
    const prev: Record<string, ListData | undefined> = {}
    const updated = buildUpdatedItem(id, next)
    for (const s of ALL_STATUSES) {
      const key = s
      const before = getCachedList(s)
      prev[key] = before ? { items: before.items.slice() } : undefined
      if (!before || !updated) continue
      const without = before.items.filter((x) => x.id !== id)
      const shouldInclude = s === "all" || updated.status === s
      const items = shouldInclude ? [updated, ...without] : without
      setCachedList(s, { items })
    }
    return prev
  }

  const mutation = useMutation({
    mutationFn: ({
      id,
      next,
    }: Readonly<{
      id: string
      next: AdminAffiliateConversion["status"]
    }>): Promise<AdminAffiliateConversion> => adminApi.updateAffiliateConversionStatus(id, next),
    onMutate: async (vars) => {
      await queryClient.cancelQueries({
        queryKey: ["admin", "affiliate", "conversions"],
        exact: false,
      })
      const snapshot = applyOptimistic(vars.id, vars.next)
      return { snapshot } as const
    },
    onError: (err, _vars, ctx) => {
      const snap = ctx?.snapshot as Record<string, ListData | undefined> | undefined
      if (!snap) return
      for (const s of ALL_STATUSES) {
        const data = snap[s]
        if (data) setCachedList(s, data)
      }
      const message: string =
        err instanceof Error ? err.message : "Failed to update conversion status"
      showToast(message, { type: "error" })
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["admin", "affiliate", "conversions"],
        exact: false,
      })
    },
  })

  function formatUsd(cents: number): string {
    const dollars = Math.round(cents) / 100
    return dollars.toLocaleString(undefined, { style: "currency", currency: "USD" })
  }

  const summary = useMemo(() => {
    const count: number = filtered.length
    const totalCents: number = filtered.reduce((s, x) => s + x.commissionCents, 0)
    return { count, totalCents } as const
  }, [filtered])

  return (
    <Section>
      <PageHeader title="Affiliate" description="Moderate affiliate conversions and payouts." />

      <Toolbar className="mt-2 flex w-full flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by id, order, code..."
              className="pl-8 w-full"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
            <SelectTrigger className="w-full md:w-40 capitalize">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              {(["all", "pending", "approved", "paid"] as const).map((s) => (
                <SelectItem key={s} value={s} className="capitalize">
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Toolbar>

      <div className="mt-2 text-sm text-muted-foreground">
        Showing <span className="font-medium">{summary.count}</span>{" "}
        {summary.count === 1 ? "conversion" : "conversions"}
        {" • "}Total Commission:{" "}
        <span className="font-medium">{formatUsd(summary.totalCents)}</span>
      </div>

      <div className="mt-4 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Conversion</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Commission</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Paid At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              skeletonKeys.map((k) => (
                <TableRow key={k}>
                  <TableCell>
                    <Skeleton className="h-4 w-40" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-28" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-8 w-40 ml-auto" />
                  </TableCell>
                </TableRow>
              ))}
            {!isLoading && filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-6">
                  No conversions found.
                </TableCell>
              </TableRow>
            )}
            {!isLoading &&
              filtered.map((cv) => (
                <TableRow key={cv.id}>
                  <TableCell className="font-mono text-xs">{cv.id}</TableCell>
                  <TableCell>{new Date(cv.createdAt).toLocaleString()}</TableCell>
                  <TableCell className="font-medium">{cv.code}</TableCell>
                  <TableCell>
                    <AppLink className="underline" href={`/dashboard/admin/orders/${cv.orderId}`}>
                      {cv.orderId}
                    </AppLink>
                  </TableCell>
                  <TableCell className="font-medium">{formatUsd(cv.commissionCents)}</TableCell>
                  <TableCell>
                    <StatusBadge status={cv.status} />
                  </TableCell>
                  <TableCell>{cv.paidAt ? new Date(cv.paidAt).toLocaleString() : "-"}</TableCell>
                  <TableCell className="space-x-2 text-right">
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={isLoading || mutation.isPending || cv.status !== "pending"}
                      onClick={() => {
                        setPendingAction({ id: cv.id, next: "approved" })
                        setConfirmOpen(true)
                      }}
                    >
                      <CheckCircle2 className="mr-1 h-4 w-4" /> Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isLoading || mutation.isPending || cv.status !== "approved"}
                      onClick={() => {
                        setPendingAction({ id: cv.id, next: "paid" })
                        setConfirmOpen(true)
                      }}
                    >
                      <DollarSign className="mr-1 h-4 w-4" /> Mark Paid
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
      <ConfirmDialog
        open={confirmOpen}
        title={
          pendingAction?.next === "approved" ? "Approve conversion" : "Mark conversion as paid"
        }
        description={
          pendingAction?.next === "approved"
            ? "This will approve the conversion and make it eligible for payout."
            : "This will mark the conversion as paid and set the paid date."
        }
        onConfirm={() => {
          if (pendingAction) {
            mutation.mutate(pendingAction)
          }
          setConfirmOpen(false)
          setPendingAction(null)
        }}
        onOpenChange={(open) => {
          setConfirmOpen(open)
          if (!open) setPendingAction(null)
        }}
      />
    </Section>
  )
}

function StatusBadge({
  status,
}: Readonly<{ status: AdminAffiliateConversion["status"] }>): JSX.Element {
  const label: string = status.charAt(0).toUpperCase() + status.slice(1)
  const variant: "success" | "secondary" | "warning" =
    status === "paid" ? "success" : status === "approved" ? "secondary" : "warning"
  return <Badge variant={variant}>{label}</Badge>
}

function ConfirmDialog({
  open,
  title,
  description,
  onConfirm,
  onOpenChange,
}: Readonly<{
  open: boolean
  title: string
  description: string
  onConfirm: () => void
  onOpenChange: (open: boolean) => void
}>): JSX.Element {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onConfirm}>Confirm</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
