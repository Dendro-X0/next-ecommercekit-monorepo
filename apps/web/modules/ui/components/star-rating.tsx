import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface StarRatingProps {
  rating: number
  maxRating?: number
  size?: "sm" | "md" | "lg"
  showValue?: boolean
  className?: string
}

export function StarRating({
  rating,
  maxRating = 5,
  size = "md",
  showValue = false,
  className,
}: StarRatingProps) {
  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  }

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex">
        {Array.from({ length: maxRating }).map((_, i) => {
          const filled = i < Math.floor(rating)
          const halfFilled = i === Math.floor(rating) && rating % 1 !== 0

          return (
            <Star
              key={`star-${maxRating}-${i}`}
              className={cn(
                sizeClasses[size],
                filled || halfFilled
                  ? "fill-yellow-400 text-yellow-400"
                  : "fill-gray-200 text-gray-200",
              )}
            />
          )
        })}
      </div>
      {showValue && (
        <span className="text-sm text-muted-foreground ml-1">({rating.toFixed(1)})</span>
      )}
    </div>
  )
}
