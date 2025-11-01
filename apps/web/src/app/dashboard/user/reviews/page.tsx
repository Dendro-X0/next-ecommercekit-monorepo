"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Pencil, Plus, Star, Trash2 } from "lucide-react"
import { useSearchParams } from "next/navigation"
import type React from "react"
import { useEffect, useMemo, useState } from "react"
import { DashboardHeader } from "@/app/dashboard/user/_components/dashboard-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { SidebarInset } from "@/components/ui/sidebar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import type { CreateReviewInput, UpdateReviewInput } from "@/lib/data/reviews"
import { reviewsApi } from "@/lib/data/reviews"
import { REVIEWS_QK } from "@/lib/reviews/query-keys"
import type { UserReview } from "@/types/review"

function StarRating({
  rating,
  size = "md",
  showValue = false,
}: {
  rating: number
  size?: "sm" | "md" | "lg"
  showValue?: boolean
}): React.ReactElement {
  const filled: number = Math.round(rating)
  const iconSize: string = size === "lg" ? "h-5 w-5" : size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={`${iconSize} ${i <= filled ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground"}`}
          />
        ))}
      </div>
      {showValue && <span className="text-sm text-muted-foreground">{rating.toFixed(2)}</span>}
    </div>
  )
}

interface EditState {
  readonly mode: "create" | "edit"
  readonly open: boolean
  readonly draft?: UserReview
}

function averageRating(reviews: readonly UserReview[]): number {
  if (reviews.length === 0) return 0
  const sum: number = reviews.reduce((acc, r) => acc + r.rating, 0)
  return Number((sum / reviews.length).toFixed(2))
}

function pendingCount(reviews: readonly UserReview[]): number {
  return reviews.filter((r) => r.status === "Pending").length
}

function filterReviews(reviews: readonly UserReview[], q: string): readonly UserReview[] {
  const query = q.trim().toLowerCase()
  if (!query) return reviews
  return reviews.filter((r) =>
    [r.productName, r.title, r.content].some((v) => v.toLowerCase().includes(query)),
  )
}

export default function Page(): React.ReactElement {
  const queryClient = useQueryClient()
  const { data, isLoading, error } = useQuery<readonly UserReview[]>({
    queryKey: REVIEWS_QK,
    queryFn: () => reviewsApi.getUserReviews(),
    staleTime: 60_000,
  })
  const userReviews: readonly UserReview[] = data ?? []
  const [search, setSearch] = useState<string>("")
  const [edit, setEdit] = useState<EditState>({ mode: "create", open: false })
  const searchParams = useSearchParams()
  const [prefilledOnce, setPrefilledOnce] = useState<boolean>(false)

  const createMutation = useMutation<UserReview, Error, CreateReviewInput>({
    mutationFn: (input) => reviewsApi.createReview(input),
    onSuccess: async () => {
      setEdit((s) => ({ ...s, open: false }))
      await queryClient.invalidateQueries({ queryKey: REVIEWS_QK })
    },
  })

  const updateMutation = useMutation<UserReview, Error, { id: string; patch: UpdateReviewInput }>({
    mutationFn: ({ id, patch }) => reviewsApi.updateReview(id, patch),
    onSuccess: async () => {
      setEdit((s) => ({ ...s, open: false }))
      await queryClient.invalidateQueries({ queryKey: REVIEWS_QK })
    },
  })

  const deleteMutation = useMutation<void, Error, string, { prev?: readonly UserReview[] }>({
    mutationFn: (id: string) => reviewsApi.deleteReview(id),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: REVIEWS_QK })
      const prev = queryClient.getQueryData<readonly UserReview[]>(REVIEWS_QK)
      if (prev) {
        const next = prev.filter((r) => r.id !== id)
        queryClient.setQueryData(REVIEWS_QK, next)
      }
      return { prev }
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(REVIEWS_QK, ctx.prev)
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: REVIEWS_QK })
    },
  })

  const avg: number = useMemo(() => averageRating(userReviews), [userReviews])
  const pending: number = useMemo(() => pendingCount(userReviews), [userReviews])
  const filtered: readonly UserReview[] = useMemo(
    () => filterReviews(userReviews, search),
    [userReviews, search],
  )

  const breadcrumbs = [{ label: "Dashboard", href: "/dashboard/user" }, { label: "Reviews" }]

  useEffect(() => {
    const sp = searchParams
    if (!sp) return
    const shouldOpen: boolean = sp.get("create") === "1"
    if (!shouldOpen || prefilledOnce) return
    const productIdParam: string = sp.get("productId") ?? ""
    const productNameParam: string = sp.get("productName") ?? ""
    const ratingRaw: number = Number(sp.get("rating") ?? "5")
    const rating: number = Math.min(
      5,
      Math.max(1, Number.isFinite(ratingRaw) ? Math.round(ratingRaw) : 5),
    )
    const draft: UserReview = {
      id: `rev-${Date.now()}`,
      productId: productIdParam,
      productName: productNameParam,
      rating,
      title: "",
      content: "",
      date: new Date().toISOString().slice(0, 10),
      status: "Pending",
    }
    setEdit({ mode: "create", open: true, draft })
    setPrefilledOnce(true)
  }, [searchParams, prefilledOnce])

  function openCreate(): void {
    const draft: UserReview = {
      id: `rev-${Date.now()}`,
      productId: "",
      productName: "",
      rating: 5,
      title: "",
      content: "",
      date: new Date().toISOString().slice(0, 10),
      status: "Pending",
    }
    setEdit({ mode: "create", open: true, draft })
  }

  function openEdit(r: UserReview): void {
    setEdit({ mode: "edit", open: true, draft: { ...r } })
  }

  function closeDialog(): void {
    setEdit((s) => ({ ...s, open: false }))
  }

  function saveDraft(): void {
    if (!edit.draft) return
    if (edit.mode === "create") {
      createMutation.mutate({
        productId: edit.draft.productId,
        rating: edit.draft.rating,
        title: edit.draft.title,
        content: edit.draft.content,
      })
    } else {
      updateMutation.mutate({
        id: edit.draft.id,
        patch: { rating: edit.draft.rating, title: edit.draft.title, content: edit.draft.content },
      })
    }
  }

  function removeReview(id: string): void {
    deleteMutation.mutate(id)
  }

  function updateDraft<K extends keyof UserReview>(key: K, value: UserReview[K]): void {
    setEdit((s) => (s.draft ? { ...s, draft: { ...(s.draft as UserReview), [key]: value } } : s))
  }

  return (
    <SidebarInset>
      <DashboardHeader title="Reviews" breadcrumbs={breadcrumbs} />
      <div className="flex-1 space-y-6 p-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Total Reviews</CardTitle>
              <CardDescription>All reviews you have submitted.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userReviews.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Average Rating</CardTitle>
              <CardDescription>Your overall rating across reviews.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center gap-2">
              <StarRating rating={avg} showValue size="lg" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Pending</CardTitle>
              <CardDescription>Awaiting moderation.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pending}</div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <Input
            placeholder="Search reviews..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="md:max-w-sm"
          />
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> Write Review
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your Reviews</CardTitle>
            <CardDescription>Manage and edit your product reviews.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-muted-foreground">
                      Loading reviews...
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-destructive">
                      Failed to load reviews
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.productName || "—"}</TableCell>
                      <TableCell>
                        <StarRating rating={r.rating} size="sm" showValue />
                      </TableCell>
                      <TableCell>{r.title || "—"}</TableCell>
                      <TableCell>{r.date}</TableCell>
                      <TableCell>
                        <Badge variant={r.status === "Published" ? "default" : "secondary"}>
                          {r.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => openEdit(r)}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => removeReview(r.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={edit.open} onOpenChange={(open) => setEdit((s) => ({ ...s, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{edit.mode === "create" ? "Write a Review" : "Edit Review"}</DialogTitle>
            <DialogDescription>Share your experience with the product.</DialogDescription>
          </DialogHeader>
          {edit.draft && (
            <div className="space-y-4">
              <Input
                placeholder="Product ID"
                value={edit.draft.productId}
                onChange={(e) => updateDraft("productId", e.target.value)}
              />
              <Input
                placeholder="Product name"
                value={edit.draft.productName}
                onChange={(e) => updateDraft("productName", e.target.value)}
              />
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Rating</span>
                <Select
                  value={String(edit.draft.rating)}
                  onValueChange={(v) => updateDraft("rating", Number(v))}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue placeholder="5" />
                  </SelectTrigger>
                  <SelectContent>
                    {[5, 4, 3, 2, 1].map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n} Stars
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Input
                placeholder="Title"
                value={edit.draft.title}
                onChange={(e) => updateDraft("title", e.target.value)}
              />
              <Textarea
                placeholder="Write your review..."
                value={edit.draft.content}
                onChange={(e) => updateDraft("content", e.target.value)}
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={closeDialog}>
                  Cancel
                </Button>
                <Button onClick={saveDraft}>{edit.mode === "create" ? "Create" : "Save"}</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </SidebarInset>
  )
}
