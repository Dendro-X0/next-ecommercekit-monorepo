"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Ban, CheckCircle2, RotateCcw, Search } from "lucide-react"
import type { JSX } from "react"
import { useMemo, useState } from "react"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ADMIN_REVIEWS_FILTERED_QK } from "@/lib/admin/reviews/query-keys"
import { type AdminReview, adminApi } from "@/lib/data/admin-api"

/**
 * Admin → Customers → Reviews
 * List and moderate customer product reviews.
 */
export default function Page(): JSX.Element {
  const [search, setSearch] = useState<string>("")
  const [status, setStatus] = useState<FilterStatus>("all")
  const queryClient = useQueryClient()
  const [confirmOpen, setConfirmOpen] = useState<boolean>(false)
  const [pendingAction, setPendingAction] = useState<Readonly<{
    id: string
    next: AdminReview["status"]
  }> | null>(null)

  const { data, isLoading } = useQuery<Readonly<{ items: readonly AdminReview[] }>>({
    queryKey: ADMIN_REVIEWS_FILTERED_QK(status),
    queryFn: (): Promise<Readonly<{ items: readonly AdminReview[] }>> =>
      adminApi.listReviews({ status: status === "all" ? undefined : status, limit: 100 }),
    staleTime: 30_000,
  })
  const items: readonly AdminReview[] = data?.items ?? []

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return items
    return items.filter(
      (x) =>
        x.id.toLowerCase().includes(term) ||
        (x.userId ?? "").toLowerCase().includes(term) ||
        x.productId.toLowerCase().includes(term) ||
        (x.title ?? "").toLowerCase().includes(term) ||
        (x.content ?? "").toLowerCase().includes(term),
    )
  }, [items, search])

  type ListData = Readonly<{ items: readonly AdminReview[] }>
  const ALL_STATUSES = ALL_REVIEW_FILTERS

  function getCachedList(s: FilterStatus): ListData | undefined {
    return queryClient.getQueryData<ListData>(ADMIN_REVIEWS_FILTERED_QK(s))
  }

  function setCachedList(s: FilterStatus, data: ListData): void {
    queryClient.setQueryData<ListData>(ADMIN_REVIEWS_FILTERED_QK(s), data)
  }

  function buildUpdatedItem(id: string, next: AdminReview["status"]): AdminReview | null {
    const sources: Array<ListData | undefined> = ALL_STATUSES.map(getCachedList)
    const found = sources.find((d) => d?.items.some((x) => x.id === id))
    const original = found?.items.find((x) => x.id === id) ?? null
    if (!original) return null
    return { ...original, status: next, updatedAt: new Date().toISOString() } as AdminReview
  }

  function applyOptimistic(
    id: string,
    next: AdminReview["status"],
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
    }: Readonly<{ id: string; next: AdminReview["status"] }>): Promise<AdminReview> =>
      adminApi.updateReviewStatus(id, next),
    onMutate: async (vars) => {
      await queryClient.cancelQueries({ queryKey: ["admin", "reviews"], exact: false })
      const snapshot = applyOptimistic(vars.id, vars.next)
      return { snapshot } as const
    },
    onError: (_err, _vars, ctx) => {
      const snap = ctx?.snapshot as Record<string, ListData | undefined> | undefined
      if (!snap) return
      for (const s of ALL_STATUSES) {
        const data = snap[s]
        if (data) setCachedList(s, data)
      }
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "reviews"], exact: false })
    },
  })

  return (
    <Section>
      <PageHeader title="Reviews" description="Moderate customer product reviews." />

      <Toolbar className="mt-2 flex w-full flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by id, user, product, title..."
              className="pl-8 w-full"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={status} onValueChange={(v) => setStatus(v as FilterStatus)}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              {ALL_REVIEW_FILTERS.map((s) => (
                <SelectItem key={s} value={s} className="capitalize">
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Toolbar>

      <div className="mt-4 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Review</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((rv) => (
              <TableRow key={rv.id}>
                <TableCell className="font-mono text-xs">{rv.id}</TableCell>
                <TableCell>{new Date(rv.createdAt).toLocaleString()}</TableCell>
                <TableCell className="font-mono text-xs">{rv.userId ?? "-"}</TableCell>
                <TableCell className="font-mono text-xs">{rv.productId}</TableCell>
                <TableCell>{rv.rating}</TableCell>
                <TableCell className="max-w-[240px] truncate" title={rv.title ?? ""}>
                  {rv.title ?? ""}
                </TableCell>
                <TableCell>
                  <StatusBadge status={rv.status} />
                </TableCell>
                <TableCell className="space-x-2 text-right">
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={isLoading || mutation.isPending || rv.status === "Published"}
                    onClick={() => {
                      setPendingAction({ id: rv.id, next: "Published" })
                      setConfirmOpen(true)
                    }}
                  >
                    <CheckCircle2 className="mr-1 h-4 w-4" /> Publish
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isLoading || mutation.isPending || rv.status === "Rejected"}
                    onClick={() => {
                      setPendingAction({ id: rv.id, next: "Rejected" })
                      setConfirmOpen(true)
                    }}
                  >
                    <Ban className="mr-1 h-4 w-4" /> Reject
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={isLoading || mutation.isPending || rv.status === "Pending"}
                    onClick={() => {
                      setPendingAction({ id: rv.id, next: "Pending" })
                      setConfirmOpen(true)
                    }}
                  >
                    <RotateCcw className="mr-1 h-4 w-4" /> Reset
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
          pendingAction?.next === "Published"
            ? "Publish review"
            : pendingAction?.next === "Rejected"
              ? "Reject review"
              : "Reset review to Pending"
        }
        description={
          pendingAction?.next === "Published"
            ? "This will publish the review and make it visible on the product page."
            : pendingAction?.next === "Rejected"
              ? "This will reject the review. It will not appear on the site."
              : "This will set the review status back to Pending."
        }
        onConfirm={() => {
          if (pendingAction) mutation.mutate(pendingAction)
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

const ALL_REVIEW_FILTERS = ["all", "Pending", "Published", "Rejected"] as const
type FilterStatus = (typeof ALL_REVIEW_FILTERS)[number]

function StatusBadge({ status }: Readonly<{ status: AdminReview["status"] }>): JSX.Element {
  const variant: "secondary" | "success" | "destructive" =
    status === "Published" ? "success" : status === "Rejected" ? "destructive" : "secondary"
  return <Badge variant={variant}>{status}</Badge>
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
