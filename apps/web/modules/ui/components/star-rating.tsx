import { Star } from "lucide-react"
import { useId, useMemo } from "react"
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
  const uid = useId()
  const starKeys = useMemo(
    () => Array.from({ length: maxRating }, (_v, i) => `${uid}-${i}`),
    [maxRating, uid],
  )

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex" aria-hidden="true">
        {starKeys.map((key, i) => {
          const filled = i < Math.floor(rating)
          const halfFilled = i === Math.floor(rating) && rating % 1 !== 0

          return (
            <Star
              key={key}
              className={cn(
                sizeClasses[size],
                filled || halfFilled
                  ? "fill-yellow-400 text-yellow-400"
                  : "fill-gray-200 text-gray-200",
              )}
              aria-hidden="true"
            />
          )
        })}
      </div>
      <span className="sr-only">Rating: {rating} out of {maxRating}</span>
      {showValue && (
        <span className="text-sm text-muted-foreground ml-1">({rating.toFixed(1)})</span>
      )}
    </div>
  )
}
