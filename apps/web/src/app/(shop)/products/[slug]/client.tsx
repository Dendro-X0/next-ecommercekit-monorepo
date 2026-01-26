"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Heart,
  Minus,
  Plus,
  Share2,
  ShoppingCart,
  ShieldCheck,
  Truck,
  RotateCcw,
  Clock,
  Layers,
  CheckCircle2,
  PackageCheck
} from "lucide-react"
import { useParams } from "next/navigation"
import { type ReactElement, useEffect, useId, useMemo, useState } from "react"
import { MobilePdpBar } from "@/components/product/mobile-pdp-bar"
import { ProductFAQ } from "@/components/product/product-faq"
import { RelatedProducts } from "@/components/product/related-products"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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
import { SafeImage } from "@/components/ui/safe-image"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { StarRating } from "@/components/ui/star-rating"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useSession } from "@/hooks/use-session"
import { isDigitalProduct } from "@/lib/cart/utils"
import { productsApi } from "@/lib/data/products"
import { reviewsApi } from "@/lib/data/reviews"
import { wishlistApi } from "@/lib/data/wishlist"
import { PRODUCT_REVIEWS_QK } from "@/lib/reviews/query-keys"
import { productsDisabled } from "@/lib/safe-mode"
import { useCartStore } from "@/lib/stores/cart"
import { showToast } from "@/lib/utils/toast"
import { WISHLIST_HAS_QK, WISHLIST_QK } from "@/lib/wishlist/query-keys"
import type { Product } from "@/types"
import type { UserReview } from "@/types/review"
import { AppLink } from "../../../../../modules/shared/components/app-link"

/**
 * Client PDP page (extracted from previous page.tsx).
 */
export default function ProductPageClient(): ReactElement {
  const isDisabled: boolean = productsDisabled
  // Stable keys for loading thumbnail skeletons
  const skeletonThumbKeys = useMemo<readonly string[]>(
    () => Array.from({ length: 4 }, (_v, i) => `pdp-thumb-skel-${i}`),
    [],
  )
  // Unique IDs for a11y error messages
  const ratingErrorId = useId()
  const contentErrorId = useId()
  const quantityId = useId()
  const params = useParams<{ slug?: string | string[] }>()
  const slugParam = params?.slug
  const slug: string =
    typeof slugParam === "string" ? slugParam : Array.isArray(slugParam) ? slugParam[0] : ""
  const isSlugReady: boolean = slug.trim().length > 0

  const {
    data: product,
    isLoading,
    error,
  } = useQuery<Product>({
    queryKey: ["product", slug],
    queryFn: () => productsApi.bySlug(slug),
    enabled: isSlugReady && !isDisabled,
    retry: 0,
  })

  const [selectedImage, setSelectedImage] = useState<number>(0)
  const [quantity, setQuantity] = useState<number>(1)
  const { addItem } = useCartStore()
  const queryClient = useQueryClient()

  // Tabs: deep-linking via hash (declare early so queries can depend on it)
  const [tab, setTab] = useState<string>("description")
  useEffect(() => {
    if (window?.location.hash) {
      setTab(window.location.hash.slice(1))
    }
  }, [])
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hash = `#${tab}`
      if (window.location.hash !== hash) {
        history.replaceState(null, "", hash)
      }
    }
  }, [tab])

  // Compute productId early (may be empty until product loads)
  const productId: string = product?.id ?? ""

  const { data: productReviews = [] } = useQuery<readonly UserReview[]>({
    queryKey: PRODUCT_REVIEWS_QK(productId),
    queryFn: () => reviewsApi.getProductReviews(productId),
    enabled: productId.length > 0 && tab === "reviews" && !isDisabled,
    retry: 0,
    staleTime: 60_000,
  })

  // Derived stats from published reviews
  const publishedReviews: readonly UserReview[] = productReviews.filter(
    (r) => r.status === "Published",
  )
  const reviewCount: number = publishedReviews.length
  const avgRating: number =
    reviewCount > 0
      ? Number((publishedReviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount).toFixed(1))
      : 0

  // Auth state (declare early, after other hooks but before UI usage)
  const session = useSession()
  const isAuthenticated: boolean = !!session?.user

  // Review modal state (after avgRating is computed)
  const [reviewOpen, setReviewOpen] = useState<boolean>(false)
  const [reviewRating, setReviewRating] = useState<number>(
    Math.max(1, Math.min(5, Math.round(avgRating || 5))),
  )
  const [reviewTitle, setReviewTitle] = useState<string>("")
  const [reviewContent, setReviewContent] = useState<string>("")
  const [reviewSuccess, setReviewSuccess] = useState<boolean>(false)
  const CONTENT_MAX: number = 1000
  type ReviewErrors = Readonly<{ rating?: string; content?: string }>
  const [reviewErrors, setReviewErrors] = useState<ReviewErrors>({})

  const validateReviewDraft = (rating: number, content: string): ReviewErrors => {
    const errs: { rating?: string; content?: string } = {}
    if (Number.isNaN(rating) || rating < 1 || rating > 5)
      errs.rating = "Please select a rating between 1 and 5."
    const len = content.trim().length
    if (len < 10) errs.content = "Please enter at least 10 characters."
    if (len > CONTENT_MAX) errs.content = `Please keep your review under ${CONTENT_MAX} characters.`
    return errs
  }

  const createReview = useMutation<
    UserReview,
    Error,
    {
      readonly productId: string
      readonly rating: number
      readonly title?: string
      readonly content?: string
    },
    { readonly prev?: readonly UserReview[]; readonly tempId?: string }
  >({
    mutationFn: async (vars) => reviewsApi.createReview(vars),
    onMutate: async (vars) => {
      await queryClient.cancelQueries({ queryKey: PRODUCT_REVIEWS_QK(productId) })
      const prev = queryClient.getQueryData<readonly UserReview[]>(PRODUCT_REVIEWS_QK(productId))
      const tempId = `temp-${Date.now()}`
      const optimistic: UserReview = {
        id: tempId,
        productId,
        productName: product?.name ?? "",
        rating: vars.rating,
        title: vars.title ?? "",
        content: vars.content ?? "",
        date: new Date().toISOString().slice(0, 10),
        status: "Pending",
      }
      queryClient.setQueryData<readonly UserReview[]>(PRODUCT_REVIEWS_QK(productId), (old) => [
        optimistic,
        ...(old ?? []),
      ])
      setTab("reviews")
      return { prev, tempId }
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(PRODUCT_REVIEWS_QK(productId), ctx.prev)
      const msg: string = err instanceof Error ? err.message : "Failed to create review"
      showToast(msg, { type: "error" })
    },
    onSuccess: (created, _vars, ctx) => {
      queryClient.setQueryData<readonly UserReview[]>(PRODUCT_REVIEWS_QK(productId), (old) => {
        const list = old ?? []
        if (!ctx?.tempId) return [created, ...list]
        return [created, ...list.filter((r) => r.id !== ctx.tempId)]
      })
      showToast("Review created", { type: "success" })
      setReviewSuccess(true)
      setReviewErrors({})
      setReviewTitle("")
      setReviewContent("")
      // Auto-close the modal shortly after success so users can see the banner
      window.setTimeout(() => {
        setReviewOpen(false)
        setReviewSuccess(false)
      }, 1200)
    },
  })

  // Important: declare all hooks before any conditional returns to keep hook order stable
  const { data: isWishlisted = false } = useQuery<boolean>({
    queryKey: WISHLIST_HAS_QK(productId),
    queryFn: () => wishlistApi.has(productId),
    enabled: productId.length > 0,
    staleTime: 60_000,
  })

  const toggleWishlist = useMutation<boolean, Error, void, { prev?: boolean }>({
    mutationFn: () => wishlistApi.toggle(productId),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: WISHLIST_HAS_QK(productId) })
      const prev = queryClient.getQueryData<boolean>(WISHLIST_HAS_QK(productId))
      queryClient.setQueryData<boolean>(WISHLIST_HAS_QK(productId), !(prev ?? false))
      return { prev }
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.prev !== undefined) queryClient.setQueryData(WISHLIST_HAS_QK(productId), ctx.prev)
      const message: string = err instanceof Error ? err.message : "Failed to update wishlist"
      showToast(message, { type: "error" })
    },
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: WISHLIST_QK }),
        queryClient.invalidateQueries({ queryKey: WISHLIST_HAS_QK(productId) }),
      ])
    },
  })

  useEffect(() => {
    if (error) {
      const message: string = error instanceof Error ? error.message : "Failed to load product"
      showToast(message, { type: "error" })
    }
  }, [error])

  // (tab state moved earlier to allow queries to depend on it)

  if (isLoading || !isSlugReady) {
    return (
      <div className="container mx-auto px-4 pt-8 pb-28 lg:pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-4">
            <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
              <Skeleton className="h-full w-full" />
            </div>
            <div className="flex gap-2">
              {skeletonThumbKeys.map((k) => (
                <Skeleton key={k} className="aspect-square w-16 sm:w-20 rounded-md" />
              ))}
            </div>
          </div>
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-20" />
              </div>
              <Skeleton className="h-8 w-64 mb-2" />
              <Skeleton className="h-4 w-40" />
            </div>
            <div className="flex items-center gap-4">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-6 w-20" />
            </div>
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-20 w-full" />
            <div className="flex gap-4">
              <Skeleton className="h-10 w-40" />
              <div data-testid="pdp-wishlist-toggle" data-ready="false">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-12 h-12 p-0 sm:w-auto"
                  disabled
                  aria-pressed={false}
                  aria-label="Add to wishlist"
                >
                  <Heart className="h-4 w-4 opacity-50 animate-pulse" />
                </Button>
              </div>
              <Skeleton className="h-10 w-12" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!product || error) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <h1 className="text-2xl font-semibold">Product not found</h1>
        <p className="text-muted-foreground mt-2">
          The requested product does not exist or failed to load.
        </p>
        <div
          className="mt-6 flex justify-center"
          data-testid="pdp-wishlist-toggle"
          data-ready="false"
        >
          <Button
            size="lg"
            variant="outline"
            className="w-12 h-12 p-0"
            disabled
            aria-pressed={false}
            aria-label="Add to wishlist"
          >
            <Heart className="h-4 w-4 opacity-50" />
          </Button>
        </div>
      </div>
    )
  }

  const hasDiscount = product.originalPrice && product.originalPrice > product.price
  const isDigital = isDigitalProduct(product)
  const hasReviews: boolean = publishedReviews.length > 0

  const formatPrice = (value: number): string =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value)

  const handleShare = async (): Promise<void> => {
    const url: string = typeof window !== "undefined" ? window.location.href : ""
    try {
      if (navigator.share) {
        await navigator.share({ title: product.name, url })
        showToast("Share dialog opened", { type: "success" })
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url)
        showToast("Link copied to clipboard", { type: "success" })
      } else {
        showToast("Sharing not supported", { type: "error" })
      }
    } catch (err) {
      const message: string = err instanceof Error ? err.message : "Failed to share"
      showToast(message, { type: "error" })
    }
  }

  return (
    <div className="container mx-auto px-4 pt-8 pb-28 lg:pb-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-4">
          <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
            <SafeImage
              src={product.images[selectedImage] || "/placeholder.svg"}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(min-width: 1024px) 50vw, 100vw"
            />
            {hasDiscount && (
              <Badge variant="destructive" className="absolute top-4 left-4">
                {Math.round(
                  ((product.originalPrice! - product.price) / product.originalPrice!) * 100,
                )}
                % OFF
              </Badge>
            )}
          </div>

          {product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto snap-x snap-mandatory">
              {product.images.map((image, index) => (
                <button
                  key={image || String(index)}
                  type="button"
                  aria-current={selectedImage === index}
                  aria-label={`${product.name} image ${index + 1}`}
                  onClick={() => setSelectedImage(index)}
                  className={`relative aspect-square w-16 sm:w-20 overflow-hidden rounded-md border-2 transition-all snap-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${selectedImage === index ? "border-primary" : "border-transparent"
                    }`}
                >
                  <SafeImage
                    src={image || "/placeholder.svg"}
                    alt={`${product.name} ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <nav aria-label="Breadcrumb" className="mb-3 text-sm text-muted-foreground">
              <ol className="flex items-center gap-2">
                <li>
                  <AppLink href="/" className="hover:underline">
                    Home
                  </AppLink>
                </li>
                <li aria-hidden="true">/</li>
                <li>
                  <AppLink href="/shop" className="hover:underline">
                    Shop
                  </AppLink>
                </li>
                <li aria-hidden="true">/</li>
                <li className="text-foreground" aria-current="page">
                  {product.name}
                </li>
              </ol>
            </nav>

            <div className="flex flex-wrap items-center gap-2 mb-3">
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors">
                {product.category}
              </Badge>
              <Badge variant={isDigital ? "default" : "outline"} className={isDigital ? "bg-blue-600 hover:bg-blue-700" : "border-muted-foreground/30"}>
                {isDigital ? "Digital Download" : "Physical Shipping"}
              </Badge>
              {product.inStock && (
                <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                  Ready to Ship
                </Badge>
              )}
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-2 text-foreground">
              {product.name}
            </h1>
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center bg-muted/30 px-2 py-1 rounded-md border border-border/50">
                <StarRating rating={avgRating} size="sm" showValue={false} />
                <span className="text-xs font-bold ml-1.5">{avgRating > 0 ? avgRating : "New"}</span>
              </div>
              <Separator orientation="vertical" className="h-4 bg-border/50" />
              <span className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors cursor-pointer" onClick={() => setTab("reviews")}>
                {hasReviews ? `${reviewCount} Reviews` : "No reviews"}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-baseline gap-3 bg-muted/20 p-4 sm:p-5 rounded-2xl border border-border/30">
            <span className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">{formatPrice(product.price)}</span>
            {hasDiscount && (
              <div className="flex items-center gap-2">
                <span className="text-lg sm:text-xl text-muted-foreground line-through font-medium">
                  {formatPrice(product.originalPrice!)}
                </span>
                <Badge variant="destructive" className="animate-pulse bg-red-600 rounded-full py-0 px-2 text-[10px] font-bold">
                  -{Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)}%
                </Badge>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Quantity</span>
              <div className="flex items-center bg-background/50 border border-border/50 rounded-xl overflow-hidden shadow-sm h-11 w-full sm:w-auto">
                <Button
                  variant="ghost"
                  size="icon"
                  type="button"
                  className="h-full w-14 sm:w-12 hover:bg-muted/50 rounded-none border-r border-border/50"
                  aria-label="Decrease quantity"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <output id={quantityId} className="flex-1 sm:flex-none px-6 min-w-14 text-center font-bold text-base" aria-live="polite">
                  {quantity}
                </output>
                <Button
                  variant="ghost"
                  size="icon"
                  type="button"
                  className="h-full w-14 sm:w-12 hover:bg-muted/50 rounded-none border-l border-border/50"
                  aria-label="Increase quantity"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                type="button"
                size="lg"
                className="h-14 rounded-xl px-8 flex-1 text-base font-bold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300"
                disabled={!product.inStock}
                onClick={() => addItem(product, quantity)}
              >
                <ShoppingCart className="h-5 w-5 mr-3" />
                Add to Cart
              </Button>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="lg"
                  variant="outline"
                  className={`h-14 w-full flex-1 sm:w-14 sm:flex-none p-0 rounded-xl border-border/50 hover:bg-muted/30 transition-all ${isWishlisted ? "text-red-500 border-red-500/30 bg-red-500/5 hover:bg-red-500/10" : ""}`}
                  onClick={() => toggleWishlist.mutate()}
                  disabled={toggleWishlist.isPending}
                  aria-pressed={isWishlisted}
                  aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                >
                  <Heart className={`h-5 w-5 ${isWishlisted ? "fill-current" : ""}`} />
                  <span className="ml-2 sm:hidden font-bold">Wishlist</span>
                </Button>
                <Button
                  type="button"
                  size="lg"
                  variant="outline"
                  aria-label="Share product"
                  className="h-14 w-full flex-1 sm:w-14 sm:flex-none p-0 rounded-xl border-border/50 hover:bg-muted/30 transition-all"
                  onClick={handleShare}
                >
                  <Share2 className="h-5 w-5" />
                  <span className="ml-2 sm:hidden font-bold">Share</span>
                </Button>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-3 pt-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/20 border border-border/50 hover:border-primary/30 transition-colors group">
                <div className="p-2.5 rounded-lg bg-background text-primary shadow-sm group-hover:scale-110 transition-transform">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/80">Security</p>
                  <p className="text-xs font-bold leading-none">Safe Order</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/20 border border-border/50 hover:border-primary/30 transition-colors group">
                <div className="p-2.5 rounded-lg bg-background text-primary shadow-sm group-hover:scale-110 transition-transform">
                  {isDigital ? <Clock className="h-4 w-4" /> : <Truck className="h-4 w-4" />}
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/80">{isDigital ? "Access" : "Shipping"}</p>
                  <p className="text-xs font-bold leading-none">{isDigital ? "Instant" : "Express"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/20 border border-border/50 hover:border-primary/30 transition-colors group sm:flex xs:col-span-2 sm:col-span-1">
                <div className="p-2.5 rounded-lg bg-background text-primary shadow-sm group-hover:scale-110 transition-transform">
                  <RotateCcw className="h-4 w-4" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/80">Support</p>
                  <p className="text-xs font-bold leading-none">Premium Help</p>
                </div>
              </div>
            </div>
          </div>

          {product.tags.length > 0 && (
            <div>
              <span className="font-medium mb-2 block">Tags:</span>
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <Separator className="my-12" />

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="flex w-full h-auto items-center justify-start p-1.5 rounded-2xl bg-muted/20 border border-border/50 mb-8 sm:mb-12 overflow-x-auto no-scrollbar scroll-smooth">
          <div className="flex-shrink-0 w-4 sm:hidden" />
          <TabsTrigger
            value="description"
            className="flex-shrink-0 min-w-[130px] rounded-xl py-3 px-6 text-sm font-bold border-none data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-lg transition-all duration-300"
          >
            Description
          </TabsTrigger>
          <TabsTrigger
            value="specifications"
            className="flex-shrink-0 min-w-[130px] rounded-xl py-3 px-6 text-sm font-bold border-none data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-lg transition-all duration-300"
          >
            Details
          </TabsTrigger>
          <TabsTrigger
            value="reviews"
            className="flex-shrink-0 min-w-[130px] rounded-xl py-3 px-6 text-sm font-bold border-none data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-lg transition-all duration-300"
          >
            Reviews ({publishedReviews.length})
          </TabsTrigger>
          <TabsTrigger
            value="faq"
            className="flex-shrink-0 min-w-[130px] rounded-xl py-3 px-6 text-sm font-bold border-none data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-lg transition-all duration-300"
          >
            Support FAQ
          </TabsTrigger>
          <div className="flex-shrink-0 w-4 sm:hidden" />
        </TabsList>

        <TabsContent value="description" className="mt-6">
          <div className="prose max-w-none">
            <p className="text-muted-foreground leading-relaxed">{product.description}</p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
              incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
              exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="specifications" className="mt-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-12">
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 rounded-xl border border-border/50 bg-card/30 backdrop-blur-sm group hover:border-primary/30 transition-colors">
                <div className="p-3 rounded-lg bg-blue-500/10 text-blue-500 group-hover:scale-110 transition-transform shrink-0">
                  <Layers className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Category & Type</p>
                  <p className="text-lg font-bold text-foreground capitalize">{product.category}</p>
                  <p className="text-xs text-muted-foreground">{isDigital ? "Digital Goods & Assets" : "Physical Marketplace Item"}</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-xl border border-border/50 bg-card/30 backdrop-blur-sm group hover:border-primary/30 transition-colors">
                <div className="p-3 rounded-lg bg-purple-500/10 text-purple-500 group-hover:scale-110 transition-transform shrink-0">
                  <PackageCheck className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Inventory Identifier</p>
                  <p className="text-sm font-mono font-bold text-foreground break-all">{product.id}</p>
                  <p className="text-xs text-muted-foreground">Unique SKU for this variation</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 rounded-xl border border-border/50 bg-card/30 backdrop-blur-sm group hover:border-primary/30 transition-colors">
                <div className="p-3 rounded-lg bg-green-500/10 text-green-500 group-hover:scale-110 transition-transform shrink-0">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Availability Status</p>
                  <p className={`text-lg font-bold ${product.inStock ? "text-green-500" : "text-red-500"}`}>
                    {product.inStock ? "In Stock & Ready" : "Out of Stock"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isDigital ? "Instant delivery to your account" : "Calculated at checkout"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-xl border border-border/50 bg-card/30 backdrop-blur-sm group hover:border-primary/30 transition-colors">
                <div className="p-3 rounded-lg bg-orange-500/10 text-orange-500 group-hover:scale-110 transition-transform shrink-0">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Security & Protection</p>
                  <p className="text-lg font-bold text-foreground">Buyer Protection</p>
                  <p className="text-xs text-muted-foreground">Premium security on every order</p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="reviews" className="mt-8">
          <div className="space-y-5 sm:space-y-6 rounded-lg border bg-card p-4 sm:p-6">
            {publishedReviews.length > 0 ? (
              publishedReviews.map((review) => (
                <div key={review.id} className="border-b pb-5 sm:pb-6 last:border-b-0 last:pb-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <StarRating rating={review.rating} size="sm" />
                      {review.title && <span className="font-medium">{review.title}</span>}
                    </div>
                    <span className="text-sm text-muted-foreground">{review.date}</span>
                  </div>
                  {review.content && <p className="text-muted-foreground">{review.content}</p>}
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">
                No reviews yet. Be the first to review this product!
              </p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="faq" className="mt-8">
          <div className="rounded-lg border bg-card p-3 sm:p-5 space-y-3">
            <ProductFAQ />
          </div>
        </TabsContent>
      </Tabs>

      <Separator className="my-12" />

      <RelatedProducts currentProductId={product.id} category={product.category} limit={4} />
      <MobilePdpBar product={product} quantity={quantity} disabled={!product.inStock} />
      {/* Review Dialog */}
      <Dialog open={reviewOpen} onOpenChange={(v: boolean): void => setReviewOpen(v)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Write a Review</DialogTitle>
            <DialogDescription>Share your experience with this product.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {!isAuthenticated && (
              <div className="rounded-md border bg-muted/40 p-3 text-sm">
                You need an account to write a review. Please
                <AppLink href="/auth/login" className="underline px-1">
                  Login
                </AppLink>
                or
                <AppLink href="/auth/signup" className="underline px-1">
                  Register
                </AppLink>
                .
              </div>
            )}
            {reviewSuccess && (
              <Alert className="border-green-600/30">
                <AlertTitle>Success</AlertTitle>
                <AlertDescription>Your review was submitted.</AlertDescription>
              </Alert>
            )}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Rating</span>
              <Select
                value={String(reviewRating)}
                onValueChange={(v): void => setReviewRating(Number(v))}
                disabled={!isAuthenticated}
              >
                <SelectTrigger
                  className="w-24"
                  aria-invalid={!!reviewErrors.rating}
                  aria-describedby={reviewErrors.rating ? ratingErrorId : undefined}
                >
                  <SelectValue placeholder="5" />
                </SelectTrigger>
                <SelectContent>
                  {[5, 4, 3, 2, 1].map((r) => (
                    <SelectItem key={r} value={String(r)}>
                      {r} Stars
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {reviewErrors.rating && (
              <p id={ratingErrorId} className="text-xs text-red-600">
                {reviewErrors.rating}
              </p>
            )}
            <Input
              placeholder="Title (optional)"
              value={reviewTitle}
              onChange={(e): void => setReviewTitle(e.target.value)}
              disabled={!isAuthenticated}
            />
            <div>
              <Textarea
                placeholder="Write your review... (min 10 chars)"
                value={reviewContent}
                onChange={(e): void => setReviewContent(e.target.value)}
                aria-invalid={!!reviewErrors.content}
                aria-describedby={reviewErrors.content ? contentErrorId : undefined}
                disabled={!isAuthenticated}
              />
              <div className="mt-1 flex justify-end text-xs">
                <span
                  className={
                    reviewContent.trim().length > CONTENT_MAX
                      ? "text-red-600"
                      : "text-muted-foreground"
                  }
                >
                  {reviewContent.trim().length}/{CONTENT_MAX}
                </span>
              </div>
              {reviewErrors.content && (
                <p id={contentErrorId} className="mt-1 text-xs text-red-600">
                  {reviewErrors.content}
                </p>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" type="button" onClick={(): void => setReviewOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={(): void => {
                  const errs = validateReviewDraft(reviewRating, reviewContent)
                  setReviewErrors(errs)
                  if (Object.keys(errs).length > 0 || !isAuthenticated) return
                  createReview.mutate({
                    productId,
                    rating: reviewRating,
                    title: reviewTitle.trim() || undefined,
                    content: reviewContent.trim() || undefined,
                  })
                }}
                disabled={createReview.isPending || !isAuthenticated}
              >
                {createReview.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
