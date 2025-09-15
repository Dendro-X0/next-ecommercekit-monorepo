"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import Image from "next/image"
import { useRouter } from "next/navigation"
import type React from "react"
import { useEffect, useId, useMemo, useRef, useState } from "react"
import type { Resolver } from "react-hook-form"
import { type FieldErrors, useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { categoriesApi } from "@/lib/data/categories"
import { productsApi } from "@/lib/data/products"
import { links } from "@/lib/links"
import type { Category, Product } from "@/types"
import { Textarea } from "../../../../../modules/ui/components/textarea"
import { MediaUploader } from "./media-uploader"

/** Create a URL-friendly slug */
const slugify = (input: string): string =>
  input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")

type ProductFormProps = Readonly<{ productId?: string }>

/**
 * ProductForm
 * Typed admin form for creating or updating a product.
 * @param {Readonly<{ productId?: string }>} props - Optional productId to switch to edit mode; when omitted, the form creates a new product.
 * @returns {React.ReactElement} The product form UI.
 */
export function ProductForm({ productId }: ProductFormProps): React.ReactElement {
  const router = useRouter()
  const qc = useQueryClient()
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | undefined>(undefined)
  type MediaItem = Readonly<{ url: string; kind: "image" | "video" }>
  const [gallery, setGallery] = useState<readonly MediaItem[]>([])
  const [_debug, setDebug] = useState<string>("idle")
  const [isUploadingMedia, setIsUploadingMedia] = useState<boolean>(false)
  const initializedForId = useRef<string | null>(null)
  // Unique IDs for form controls (avoid static ids)
  const shippingId = useId()
  const weightId = useId()
  const digitalVersionId = useId()
  const nameId = useId()
  const slugId = useId()
  const descriptionId = useId()
  const categoryInputId = useId()
  const categoryDatalistId = useId()
  const priceId = useId()
  const featuredId = useId()

  const schema = useMemo(
    () =>
      z.object({
        name: z.string().min(2, "Name is too short"),
        slug: z
          .string()
          .min(2, "Slug is required")
          .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and dashes"),
        // Normalize price to avoid NaN from empty/invalid inputs
        price: z.preprocess(
          (v: unknown) => {
            if (v === null || v === undefined) return undefined
            const n: number = typeof v === "string" ? Number.parseFloat(v) : (v as number)
            return Number.isFinite(n) ? n : undefined
          },
          z.number().min(0, { message: "Price cannot be negative" }),
        ),
        categorySlug: z.string().min(1, "Select a category").optional(),
        // Accept absolute URLs or app-relative paths (e.g., "/uploads/xyz.jpg")
        imageUrl: z
          .string()
          .optional()
          .refine(
            (v) => v === undefined || v.length === 0 || v.startsWith("/") || /^https?:\/\//.test(v),
            {
              message: "Enter a valid URL or a path starting with /",
            },
          ),
        // Optional long-form product description; empty string becomes undefined
        description: z.preprocess(
          (v: unknown) => (typeof v === "string" && v.trim().length === 0 ? undefined : v),
          z
            .string()
            .trim()
            .min(1, "Enter a description")
            .max(5000, "Description is too long")
            .optional(),
        ),
        featured: z.boolean().default(false),
        kind: z.enum(["digital", "physical"]).optional(),
        shippingRequired: z.boolean().optional(),
        // Optional weight: treat ""/NaN as undefined
        weight: z.preprocess((v: unknown) => {
          if (v === null || v === undefined) return undefined
          const n: number = typeof v === "string" ? Number.parseFloat(v) : (v as number)
          return Number.isFinite(n) ? n : undefined
        }, z.number().min(0, { message: "Weight cannot be negative" }).optional()),
        // Optional digital version: empty string becomes undefined (not required)
        digitalVersion: z.preprocess(
          (v: unknown) => (typeof v === "string" && v.trim().length === 0 ? undefined : v),
          z.string().trim().optional(),
        ),
      }),
    [],
  )

  type FormValues = z.output<typeof schema>

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: {
      name: "",
      slug: "",
      price: 0,
      categorySlug: undefined,
      imageUrl: undefined,
      description: undefined,
      featured: false,
      kind: "physical",
      shippingRequired: true,
      weight: undefined,
      digitalVersion: undefined,
    },
    mode: "onBlur",
  })
  const categorySlugValue: string | undefined = watch("categorySlug") || undefined
  const featuredValue: boolean = !!watch("featured")
  const slugValue: string = watch("slug") ?? ""
  const imageUrlValue: string | undefined = watch("imageUrl") || undefined
  const kindValue: "digital" | "physical" | undefined = watch("kind")
  const shippingRequiredValue: boolean = !!watch("shippingRequired")
  // watch values accessed via errors and register; no local reads needed

  // Categories
  const { data: categoriesData } = useQuery<Readonly<{ items: readonly Category[] }>>({
    queryKey: ["categories:list"],
    queryFn: async () => categoriesApi.list(),
    staleTime: 5 * 60_000,
  })
  const categories: readonly Category[] = useMemo(
    () => categoriesData?.items ?? [],
    [categoriesData?.items],
  )
  const categoryOptions: readonly Category[] = useMemo((): readonly Category[] => {
    const hasOther: boolean = categories.some((c) => c.slug === "other")
    if (hasOther) return categories
    const other: Category = {
      id: "c-other-local",
      slug: "other",
      name: "Other",
      image: "/placeholder.svg",
      productCount: 0,
    }
    return [...categories, other]
  }, [categories])

  // Manual/searchable category input state bridged to form.categorySlug
  const [categoryInput, setCategoryInput] = useState<string>("")
  useEffect(() => {
    const currentSlug: string | undefined = categorySlugValue
    if (!currentSlug) {
      setCategoryInput("")
      return
    }
    const match = categoryOptions.find((c) => c.slug === currentSlug)
    setCategoryInput(match ? match.name : currentSlug)
  }, [categorySlugValue, categoryOptions])

  // Editing: fetch raw DTO (handled below)

  // Raw DTO for precise admin initialization (imageUrl, media, shipping, etc.)
  const { data: productDto } = useQuery<
    | Readonly<{
        id: string
        slug: string
        name: string
        price: number
        currency: "USD"
        imageUrl?: string
        description?: string
        categorySlug?: string
        featured?: boolean
        media?: ReadonlyArray<Readonly<{ url: string; kind: "image" | "video" }>>
        kind?: "digital" | "physical"
        shippingRequired?: boolean
        weightGrams?: number
        digitalVersion?: string
      }>
    | undefined
  >({
    queryKey: ["admin-product-dto", productId],
    queryFn: async () => {
      if (!productId) return undefined
      return await productsApi.byIdDto(productId)
    },
    enabled: !!productId,
    staleTime: 60_000,
  })

  useEffect(() => {
    if (!productDto) return
    const pid: string = productDto.id || productDto.slug || "unknown"
    if (initializedForId.current === pid) return
    const firstImageUrl: string | undefined =
      (Array.isArray(productDto.media)
        ? productDto.media.find((m) => m.kind === "image")?.url
        : undefined) ||
      (productDto.imageUrl && productDto.imageUrl.trim().length > 0
        ? productDto.imageUrl
        : undefined)
    reset({
      name: productDto.name ?? "",
      slug: productDto.slug ?? slugify(productDto.name ?? ""),
      price: typeof productDto.price === "number" ? Math.round(productDto.price) / 100 : 0,
      categorySlug: productDto.categorySlug,
      imageUrl: firstImageUrl,
      description: productDto.description,
      featured: !!productDto.featured,
      kind: productDto.kind ?? "physical",
      shippingRequired:
        productDto.kind === "digital" ? false : (productDto.shippingRequired ?? true),
      weight:
        typeof productDto.weightGrams === "number" ? productDto.weightGrams / 1000 : undefined,
      digitalVersion: productDto.digitalVersion,
    })
    const initialMedia: readonly MediaItem[] = (productDto.media ?? []).map(
      (m) => ({ url: m.url, kind: m.kind }) as const,
    )
    setGallery(initialMedia)
    initializedForId.current = pid
  }, [productDto, reset])

  // Mutations
  const createMutation = useMutation<Product, Error, FormValues>({
    mutationFn: async (values: FormValues) =>
      productsApi.create({
        name: values.name,
        slug: values.slug,
        price: values.price,
        categorySlug: values.categorySlug,
        imageUrl: values.imageUrl,
        description: values.description,
        featured: values.featured,
        media: gallery,
        kind: values.kind === "digital" || values.kind === "physical" ? values.kind : undefined,
        shippingRequired: values.kind === "digital" ? false : !!values.shippingRequired,
        weightKg:
          values.kind !== "digital" && typeof values.weight === "number"
            ? values.weight
            : undefined,
        digitalVersion: values.kind === "digital" ? values.digitalVersion : undefined,
      }),
    onSuccess: async () => qc.invalidateQueries({ queryKey: ["admin-products"] }),
  })

  const updateMutation = useMutation<Product | undefined, Error, FormValues>({
    mutationFn: async (values: FormValues) => {
      if (!productId) return undefined
      return productsApi.updateById(productId, {
        name: values.name,
        slug: values.slug,
        price: values.price,
        categorySlug: values.categorySlug,
        imageUrl: values.imageUrl,
        description: values.description,
        featured: values.featured,
        media: gallery,
        kind: values.kind === "digital" || values.kind === "physical" ? values.kind : undefined,
        shippingRequired: values.kind === "digital" ? false : !!values.shippingRequired,
        weightKg:
          values.kind !== "digital" && typeof values.weight === "number"
            ? values.weight
            : undefined,
        digitalVersion: values.kind === "digital" ? values.digitalVersion : undefined,
      })
    },
    onSuccess: async () => qc.invalidateQueries({ queryKey: ["admin-products"] }),
  })

  const onSubmit = async (values: FormValues): Promise<void> => {
    try {
      setDebug(`submit:start id=${productId ?? "new"} gallery=${gallery.length}`)
      console.log("[ProductForm] submit start", { values, galleryCount: gallery.length, productId })
      if (productId) {
        await updateMutation.mutateAsync(values)
        toast.success("Product updated")
        setDebug("submit:success update")
        router.push(links.getDashboardAdminEcommerceProductsRoute())
        return
      }
      await createMutation.mutateAsync(values)
      toast.success("Product created")
      setDebug("submit:success create")
      router.push(links.getDashboardAdminEcommerceProductsRoute())
    } catch (e) {
      const message: string = e instanceof Error ? e.message : "Failed to save product"
      console.error("[ProductForm] submit error", e)
      if (message.toLowerCase().includes("slug already exists")) {
        setError("slug", {
          type: "validate",
          message: "Slug already exists. Please choose another.",
        })
      }
      toast.error(message)
      setDebug(`submit:error ${message}`)
    }
  }

  const isFieldError = (val: unknown): val is { message?: unknown } =>
    typeof val === "object" && val !== null && "message" in (val as Record<string, unknown>)

  const getFirstErrorMessage = (errs: FieldErrors<FormValues>): string | undefined => {
    for (const key of Object.keys(errs) as Array<keyof typeof errs>) {
      const v = errs[key]
      if (isFieldError(v) && typeof v.message === "string") return v.message
    }
    return undefined
  }

  const onInvalid = (errs: FieldErrors<FormValues>): void => {
    const m = getFirstErrorMessage(errs)
    toast.error(m ?? "Please fix the highlighted fields")
  }

  return (
    <form
      className="grid gap-6"
      onSubmit={handleSubmit(onSubmit, (errs) => {
        onInvalid(errs)
        setDebug("submit:invalid")
      })}
      noValidate
    >
      {/** unique ids defined via useId() at top */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Product Details</CardTitle>
              <CardDescription>Fill in the details of the product.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor={nameId}>Product Name</Label>
                <Input
                  id={nameId}
                  placeholder="e.g. Premium T-Shirt"
                  {...register("name")}
                  onBlur={(e) => {
                    if (!slugValue)
                      setValue("slug", slugify(e.target.value), {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                  }}
                />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor={slugId}>Slug</Label>
                <Input id={slugId} placeholder="e.g. premium-t-shirt" {...register("slug")} />
                {errors.slug && <p className="text-sm text-destructive">{errors.slug.message}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor={descriptionId}>Description</Label>
                <Textarea
                  id={descriptionId}
                  placeholder="Write a detailed description to help customers understand the product."
                  rows={6}
                  {...register("description")}
                />
                {errors.description && (
                  <p className="text-sm text-destructive">{errors.description.message as string}</p>
                )}
              </div>
              <MediaUploader
                label="Upload image(s) or video(s)"
                multiple
                disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}
                onUploadingChange={(u: boolean) => setIsUploadingMedia(u)}
                onUploaded={({ url, kind }) => {
                  if (kind === "image")
                    setValue("imageUrl", url, { shouldDirty: true, shouldValidate: true })
                  setGallery((prev) => {
                    const next = [...prev, { url, kind }]
                    return next.filter(
                      (m, i, arr) =>
                        arr.findIndex((x) => x.url === m.url && x.kind === m.kind) === i,
                    )
                  })
                  if (kind === "video") setVideoPreviewUrl(url)
                }}
                onUploadedMany={(results) => {
                  const firstImage = results.find((r) => r.kind === "image")
                  if (!imageUrlValue && firstImage)
                    setValue("imageUrl", firstImage.url, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  setGallery((prev) => {
                    const next = [...prev, ...results]
                    return next.filter(
                      (m, i, arr) =>
                        arr.findIndex((x) => x.url === m.url && x.kind === m.kind) === i,
                    )
                  })
                  const firstVideo = results.find((r) => r.kind === "video")
                  if (firstVideo) setVideoPreviewUrl(firstVideo.url)
                }}
              />
              {gallery.length > 0 && (
                <div className="mt-3">
                  <Label>Media gallery</Label>
                  <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                    {gallery.map((m, idx) => (
                      <div key={`${m.url}-${idx}`} className="relative rounded border p-2">
                        {m.kind === "image" ? (
                          <div className="relative h-28 w-full rounded overflow-hidden">
                            <Image
                              src={m.url}
                              alt="Media"
                              fill
                              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                              className="object-cover"
                              priority={false}
                            />
                          </div>
                        ) : (
                          <video
                            className="h-28 w-full rounded object-cover"
                            src={m.url}
                            preload="metadata"
                            muted
                            playsInline
                          />
                        )}
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setGallery((prev) => prev.filter((_, i) => i !== idx))}
                          >
                            Remove
                          </Button>
                          {m.kind === "image" && (
                            <Button
                              type="button"
                              size="sm"
                              onClick={() =>
                                setValue("imageUrl", m.url, {
                                  shouldDirty: true,
                                  shouldValidate: true,
                                })
                              }
                            >
                              {imageUrlValue === m.url ? "Primary" : "Set primary"}
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {imageUrlValue && (
                <div className="mt-2">
                  <Label>Image preview</Label>
                  <div className="mt-1 relative h-28 w-28 rounded overflow-hidden border">
                    <Image
                      src={imageUrlValue}
                      alt="Upload preview"
                      fill
                      sizes="112px"
                      className="object-cover"
                    />
                  </div>
                </div>
              )}
              {videoPreviewUrl && (
                <div className="mt-2">
                  <Label>Video preview</Label>
                  {/* basic video preview */}
                  <video className="mt-1 w-64 rounded border" controls src={videoPreviewUrl}>
                    <track kind="captions" srcLang="en" label="English captions" />
                  </video>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                <Label htmlFor={categoryInputId}>Type to search or enter a category</Label>
                <Input
                  id={categoryInputId}
                  list={categoryDatalistId}
                  placeholder="e.g., E‑Books, Software, Other"
                  value={categoryInput}
                  onChange={(e) => {
                    const nextText = e.target.value
                    setCategoryInput(nextText)
                    const nextSlug = slugify(nextText)
                    setValue("categorySlug", nextSlug, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }}
                />
                <datalist id={categoryDatalistId}>
                  {categoryOptions.map((c) => (
                    <option key={c.id} value={c.name} />
                  ))}
                </datalist>
                <p className="text-xs text-muted-foreground">
                  Slug: {categorySlugValue ?? "(none)"}
                </p>
              </div>
              {errors.categorySlug && (
                <p className="mt-2 text-sm text-destructive">{errors.categorySlug.message}</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Pricing & Visibility</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor={priceId}>Price</Label>
                <Input
                  id={priceId}
                  type="number"
                  step="0.01"
                  inputMode="decimal"
                  placeholder="$99.99"
                  {...register("price", {
                    setValueAs: (v: unknown): number | undefined => {
                      const n: number = typeof v === "string" ? Number.parseFloat(v) : (v as number)
                      return Number.isNaN(n) ? undefined : n
                    },
                  })}
                />
                {errors.price && <p className="text-sm text-destructive">{errors.price.message}</p>}
              </div>
              <div className="flex items-center gap-2">
                <input
                  id={featuredId}
                  type="checkbox"
                  className="h-4 w-4"
                  checked={featuredValue}
                  onChange={(e) =>
                    setValue("featured", e.target.checked, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                />
                <Label htmlFor={featuredId}>Featured</Label>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Product Type & Shipping</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label>Product Type</Label>
                <Select
                  value={kindValue}
                  onValueChange={(v) => {
                    if (v === "digital" || v === "physical")
                      setValue("kind", v, { shouldDirty: true, shouldValidate: true })
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="physical">Physical</SelectItem>
                    <SelectItem value="digital">Digital</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {kindValue === "physical" && (
                <>
                  <div className="flex items-center gap-2">
                    <input
                      id={shippingId}
                      type="checkbox"
                      className="h-4 w-4"
                      checked={shippingRequiredValue}
                      onChange={(e) =>
                        setValue("shippingRequired", e.target.checked, {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                    />
                    <Label htmlFor={shippingId}>Requires shipping</Label>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor={weightId}>Weight (kg)</Label>
                    <Input
                      id={weightId}
                      type="number"
                      step="0.01"
                      inputMode="decimal"
                      placeholder="e.g., 0.5"
                      {...register("weight", {
                        setValueAs: (v: unknown): number | undefined => {
                          const n: number =
                            typeof v === "string" ? Number.parseFloat(v) : (v as number)
                          return Number.isNaN(n) ? undefined : n
                        },
                      })}
                    />
                    {errors.weight && (
                      <p className="text-sm text-destructive">{errors.weight.message as string}</p>
                    )}
                  </div>
                </>
              )}
              {kindValue === "digital" && (
                <div className="grid gap-2">
                  <Label htmlFor={digitalVersionId}>Digital version</Label>
                  <Input
                    id={digitalVersionId}
                    placeholder="e.g., v1.0.0"
                    {...register("digitalVersion")}
                  />
                  {errors.digitalVersion && (
                    <p className="text-sm text-destructive">
                      {errors.digitalVersion.message as string}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={isUploadingMedia}
          onClick={() => router.push(links.getDashboardAdminEcommerceProductsRoute())}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={
            isSubmitting || createMutation.isPending || updateMutation.isPending || isUploadingMedia
          }
          aria-busy={
            isSubmitting || createMutation.isPending || updateMutation.isPending || isUploadingMedia
          }
        >
          {productId
            ? updateMutation.isPending
              ? "Saving..."
              : "Save Changes"
            : createMutation.isPending
              ? "Creating..."
              : "Create Product"}
        </Button>
        {Object.keys(errors).length > 0 && (
          <p className="self-center text-sm text-destructive">
            {getFirstErrorMessage(errors) ?? "Validation error. Please check the form."}
          </p>
        )}
      </div>
    </form>
  )
}
