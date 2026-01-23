"use client"

import type { JSX } from "react"
import { useEffect, useId, useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { categories as mockCategories } from "@/lib/data"
import { uiTemplates } from "@/lib/safe-mode"
import type { FilterOptions } from "@/types"
import { Skeleton } from "@/components/ui/skeleton"

type CategoryItem = Readonly<{
  id: string
  slug: string
  name: string
  imageUrl?: string
  productCount: number
}>

interface ProductFiltersProps {
  filters: FilterOptions
  onFiltersChange: (filters: FilterOptions) => void
}

/**
 * ProductFilters component for category, type, availability and price filtering.
 * @param props.filters Initial filter state.
 * @param props.onFiltersChange Callback invoked whenever filters change.
 * @returns JSX.Element sidebar filtering UI.
 */
export function ProductFilters({ filters, onFiltersChange }: ProductFiltersProps): JSX.Element {
  const [localFilters, setLocalFilters] = useState(filters)
  const [categories, setCategories] = useState<readonly CategoryItem[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | undefined>(undefined)
  const uid = useId()
  const fid = (name: string): string => `${uid}-${name}`

  useEffect(() => {
    let mounted = true
    const load = async (): Promise<void> => {
      if (uiTemplates) {
        // Use local mock categories in UI-only mode to avoid network calls
        const local: readonly CategoryItem[] = mockCategories.map((c) => ({
          id: c.id,
          slug: c.slug,
          name: c.name,
          productCount: c.productCount,
        }))
        if (mounted) {
          setCategories(local)
          setLoading(false)
        }
        return
      }
      try {
        setLoading(true)
        setError(undefined)
        const res = await fetch("/api/v1/categories", { credentials: "include" })
        if (!res.ok) throw new Error(`Failed to fetch categories: ${res.status}`)
        const data: { items: CategoryItem[] } = await res.json()
        if (mounted) setCategories(data.items ?? [])
      } catch (e) {
        if (mounted) setError(e instanceof Error ? e.message : "Failed to load categories")
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [])

  const handleCategoryChange = (categorySlug: string, checked: boolean) => {
    const newCategories = checked
      ? [...localFilters.categories, categorySlug]
      : localFilters.categories.filter((c) => c !== categorySlug)

    const newFilters = { ...localFilters, categories: newCategories }
    setLocalFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const handlePriceRangeChange = (value: number[]) => {
    const newFilters = { ...localFilters, priceRange: [value[0], value[1]] as [number, number] }
    setLocalFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const handleInStockChange = (checked: boolean) => {
    const newFilters = { ...localFilters, inStock: checked ? true : undefined }
    setLocalFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const handleKindChange = (value: "all" | "digital" | "physical"): void => {
    const newFilters: FilterOptions = { ...localFilters, kind: value === "all" ? undefined : value }
    setLocalFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const clearFilters = () => {
    const clearedFilters: FilterOptions = {
      categories: [],
      priceRange: [0, 500],
      inStock: undefined,
    }
    setLocalFilters(clearedFilters)
    onFiltersChange(clearedFilters)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
        <h2 className="font-semibold">Filters</h2>
        <Button variant="ghost" size="sm" onClick={clearFilters} className="w-full sm:w-auto">
          Clear All
        </Button>
      </div>

      <Separator />

      {/* Type */}
      <div className="space-y-3">
        <h3 className="font-medium">Type</h3>
        <RadioGroup
          value={(localFilters.kind ?? "all") as string}
          onValueChange={(v) => handleKindChange(v as "all" | "digital" | "physical")}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem id={fid("type-all")} value="all" />
            <Label htmlFor={fid("type-all")} className="text-sm">
              All
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem id={fid("type-digital")} value="digital" />
            <Label htmlFor={fid("type-digital")} className="text-sm">
              Download
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem id={fid("type-physical")} value="physical" />
            <Label htmlFor={fid("type-physical")} className="text-sm">
              Shipping
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Categories */}
      <div className="space-y-3">
        <h3 className="font-medium">Categories</h3>
        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-auto pr-1">
            {loading && categories.length === 0 ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-2">
                    <Skeleton className="h-4 w-4 rounded-sm" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                ))}
              </div>
            ) : (
              categories.map((category) => (
                <div key={category.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={fid(`cat-${category.slug}`)}
                    checked={localFilters.categories.includes(category.slug)}
                    onCheckedChange={(checked) =>
                      handleCategoryChange(category.slug, checked as boolean)
                    }
                  />
                  <Label htmlFor={fid(`cat-${category.slug}`)} className="text-sm">
                    {category.name} ({category.productCount})
                  </Label>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <Separator />

      {/* Price Range */}
      <div className="space-y-3">
        <h3 className="font-medium">Price Range</h3>
        <div className="px-2">
          <Slider
            value={localFilters.priceRange}
            onValueChange={handlePriceRangeChange}
            max={500}
            min={0}
            step={10}
            className="w-full"
          />
          <div className="flex justify-between text-sm text-muted-foreground mt-2">
            <span>${localFilters.priceRange[0]}</span>
            <span>${localFilters.priceRange[1]}</span>
          </div>
        </div>
      </div>

      <Separator />

      {/* Availability */}
      <div className="space-y-3">
        <h3 className="font-medium">Availability</h3>
        <div className="flex items-center space-x-2">
          <Checkbox
            id={fid("in-stock")}
            checked={localFilters.inStock === true}
            onCheckedChange={handleInStockChange}
          />
          <Label htmlFor={fid("in-stock")} className="text-sm">
            In Stock Only
          </Label>
        </div>
      </div>
    </div>
  )
}
