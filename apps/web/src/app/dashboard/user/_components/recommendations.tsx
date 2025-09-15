"use client"

import { Star } from "lucide-react"
import Image from "next/image"
import type { ReactElement } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

/**
 * Recommendations card rendered on the user dashboard.
 * Uses next/image for optimized loading and responsive sizing.
 */
export function RecommendationsCard(): ReactElement {
  const items: ReadonlyArray<{ id: string; title: string; price: number; img: string }> = [
    { id: "1", title: "Recommended Product 1", price: 99.99, img: "/placeholder.svg" },
    { id: "2", title: "Recommended Product 2", price: 99.99, img: "/placeholder.svg" },
    { id: "3", title: "Recommended Product 3", price: 99.99, img: "/placeholder.svg" },
    { id: "4", title: "Recommended Product 4", price: 99.99, img: "/placeholder.svg" },
  ] as const

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5" />
          Recommended for You
        </CardTitle>
        <CardDescription>Based on your purchase history and preferences</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {items.map((it) => (
            <div key={it.id} className="border rounded-lg p-4 space-y-2">
              <div className="relative w-full h-24 overflow-hidden rounded">
                <Image
                  src={`${it.img}?height=120&width=240&text=${encodeURIComponent(it.title)}`}
                  alt={it.title}
                  fill
                  priority={false}
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 25vw"
                  className="object-cover"
                />
              </div>
              <div className="font-medium truncate" title={it.title}>
                {it.title}
              </div>
              <div className="text-sm text-muted-foreground">${it.price.toFixed(2)}</div>
              <Button size="sm" className="w-full">
                Add to Cart
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
