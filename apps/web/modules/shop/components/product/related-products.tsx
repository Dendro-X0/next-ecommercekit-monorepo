import { Heart, ShoppingCart } from "lucide-react"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { StarRating } from "@/components/ui/star-rating"
import { products } from "@/lib/data"
import { AppLink } from "../../../shared/components/app-link"

interface RelatedProductsProps {
  currentProductId: string
  category?: string
  limit?: number
}

export function RelatedProducts({ currentProductId, category, limit = 4 }: RelatedProductsProps) {
  // Filter products by category and exclude current product
  const relatedProducts = products
    .filter(
      (product) =>
        product.id !== currentProductId && (category ? product.category === category : true),
    )
    .slice(0, limit)

  if (relatedProducts.length === 0) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <h2 className="text-2xl font-bold">Related Products</h2>
        <Button variant="outline" asChild className="w-full sm:w-auto">
          <AppLink
            href={category ? `/categories/${category.toLowerCase().replace(/\s+/g, "-")}` : "/shop"}
          >
            View All
          </AppLink>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {relatedProducts.map((product) => (
          <Card
            key={product.id}
            className="group overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className="relative aspect-square overflow-hidden">
              <AppLink href={`/products/${product.slug}`}>
                <Image
                  src={product.images[0] || "/placeholder.svg"}
                  alt={product.name}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                />
              </AppLink>

              {/* Badges */}
              <div className="absolute top-2 left-2 flex flex-col gap-1">
                {product.originalPrice && product.originalPrice > product.price && (
                  <Badge variant="destructive" className="text-xs">
                    {Math.round(
                      ((product.originalPrice - product.price) / product.originalPrice) * 100,
                    )}
                    % OFF
                  </Badge>
                )}
                {!product.inStock && (
                  <Badge variant="secondary" className="text-xs">
                    Out of Stock
                  </Badge>
                )}
              </div>

              {/* Quick Actions */}
              <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-8 w-8"
                  aria-label="Add to wishlist"
                  title="Add to wishlist"
                >
                  <Heart className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <CardContent className="p-4">
              <div className="space-y-2">
                <Badge variant="outline" className="text-xs">
                  {product.category}
                </Badge>

                <AppLink href={`/products/${product.slug}`}>
                  <h3 className="font-semibold line-clamp-2 hover:text-primary transition-colors">
                    {product.name}
                  </h3>
                </AppLink>

                <div className="flex items-center gap-2">
                  <StarRating rating={product.rating} size="sm" />
                  <span className="text-xs text-muted-foreground">({product.reviewCount})</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold">${product.price}</span>
                    {product.originalPrice && product.originalPrice > product.price && (
                      <span className="text-sm text-muted-foreground line-through">
                        ${product.originalPrice}
                      </span>
                    )}
                  </div>
                </div>

                <Button size="sm" className="w-full" disabled={!product.inStock}>
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  {product.inStock ? "Add to Cart" : "Out of Stock"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
