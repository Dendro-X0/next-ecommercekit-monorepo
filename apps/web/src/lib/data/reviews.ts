import type { UserReview } from "@/types/review"

const baseAccount = "/api/v1/account/reviews" as const
const basePublic = "/api/v1/reviews" as const

type ReviewRecord = Readonly<{
  id: string
  productId: string
  rating: number
  title: string | null
  content: string | null
  status: "Pending" | "Published" | "Rejected"
  createdAt: string
  updatedAt: string
}>

function toUserReview(r: ReviewRecord): UserReview {
  return {
    id: r.id,
    productId: r.productId,
    productName: "",
    rating: r.rating,
    title: r.title ?? "",
    content: r.content ?? "",
    date: r.createdAt.slice(0, 10),
    status: r.status === "Published" ? "Published" : "Pending",
  } as const
}

async function getUserReviews(): Promise<readonly UserReview[]> {
  const res = await fetch(baseAccount, { credentials: "include" })
  if (!res.ok) throw new Error(`Failed to fetch reviews (${res.status})`)
  const data = (await res.json()) as { items: ReviewRecord[] }
  return data.items.map(toUserReview)
}

export type CreateReviewInput = Readonly<{
  productId: string
  rating: number
  title?: string
  content?: string
}>

async function createReview(input: CreateReviewInput): Promise<UserReview> {
  const res = await fetch(baseAccount, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error(`Failed to create review (${res.status})`)
  const r = (await res.json()) as ReviewRecord
  return toUserReview(r)
}

export type UpdateReviewInput = Readonly<{
  rating?: number
  title?: string
  content?: string
}>

async function updateReview(id: string, patch: UpdateReviewInput): Promise<UserReview> {
  const res = await fetch(`${baseAccount}/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(patch),
  })
  if (!res.ok) throw new Error(`Failed to update review (${res.status})`)
  const r = (await res.json()) as ReviewRecord
  return toUserReview(r)
}

async function deleteReview(id: string): Promise<void> {
  const res = await fetch(`${baseAccount}/${encodeURIComponent(id)}`, {
    method: "DELETE",
    credentials: "include",
  })
  if (!res.ok) throw new Error(`Failed to delete review (${res.status})`)
}

async function getProductReviews(productId: string, limit = 50): Promise<readonly UserReview[]> {
  const res = await fetch(`${basePublic}/product/${encodeURIComponent(productId)}?limit=${limit}`)
  if (!res.ok) throw new Error(`Failed to fetch product reviews (${res.status})`)
  const data = (await res.json()) as { items: ReviewRecord[] }
  return data.items.map(toUserReview)
}

export const reviewsApi = {
  getUserReviews,
  createReview,
  updateReview,
  deleteReview,
  getProductReviews,
} as const
export type ReviewsApi = typeof reviewsApi
