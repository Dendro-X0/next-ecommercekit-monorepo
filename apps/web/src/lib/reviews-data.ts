import type { UserReview } from "@/types/review"

const userReviews: UserReview[] = [
  {
    id: "rev-1",
    productId: "p-1",
    productName: "Wireless Bluetooth Headphones",
    rating: 5,
    title: "Excellent sound quality",
    content: "Crisp highs and rich bass. Battery life is great.",
    date: "2025-07-28",
    status: "Published",
  },
  {
    id: "rev-2",
    productId: "p-2",
    productName: "Smart Fitness Watch",
    rating: 4,
    title: "Solid value",
    content: "Accurate tracking and comfortable to wear.",
    date: "2025-08-02",
    status: "Pending",
  },
]

export default userReviews
