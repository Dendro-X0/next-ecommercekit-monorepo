export interface UserReview {
  readonly id: string
  readonly productId: string
  readonly productName: string
  readonly rating: number
  readonly title: string
  readonly content: string
  readonly date: string
  readonly status: "Published" | "Pending"
}
