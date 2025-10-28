/**
 * Categories API client.
 * One export per file: `categoriesApi`.
 */

import type { Category } from "@/types"

/** Internal server DTO. Do NOT export. */
type ServerCategoryDto = Readonly<{
  id: string
  slug: string
  name: string
  imageUrl?: string
  productCount: number
}>

/** Internal: list response (mapped to UI Category shape). */
type ListCategoriesResponse = Readonly<{
  items: readonly Category[]
}>

const API_BASE: string = "/api/v1"

async function asJson<T>(res: Response): Promise<T> {
  const ct: string | null = res.headers.get("content-type")
  const isJson: boolean = !!ct && ct.includes("application/json")
  const body: unknown = isJson ? await res.json() : undefined
  if (!res.ok) {
    const message: string =
      (body as { readonly error?: string })?.error ?? `Request failed (${res.status})`
    throw new Error(message)
  }
  return body as T
}

const toCategory = (dto: ServerCategoryDto): Category => ({
  id: dto.id,
  name: dto.name,
  slug: dto.slug,
  image: dto.imageUrl ?? "/placeholder.svg",
  productCount: dto.productCount ?? 0,
})

/**
 * categoriesApi
 * - list(): fetches all categories and maps to UI `Category`.
 */
export const categoriesApi = {
  list: async (): Promise<ListCategoriesResponse> => {
    const res: Response = await fetch(`${API_BASE}/categories`, { credentials: "include" })
    const json: { items: ServerCategoryDto[] } = await asJson<{ items: ServerCategoryDto[] }>(res)
    return { items: (json.items ?? []).map(toCategory) } as const
  },
} as const
