import type { JSX } from "react"
import { unstable_cache } from "next/cache"
import { productsDisabled } from "@/lib/safe-mode"
import { categoriesRepo } from "@repo/db"
export const revalidate = 300

export default async function CategoriesPage(): Promise<JSX.Element> {
  if (productsDisabled) {
    return (
      <div className="container mx-auto px-4 py-8 text-center text-muted-foreground">
        <h1 className="text-3xl font-bold mb-2">Categories</h1>
        <p>Category listings are disabled in safe mode.</p>
      </div>
    )
  }
  const getCategories = unstable_cache(
    async (): Promise<ReadonlyArray<Readonly<{ id: string; slug: string; name: string; image: string; productCount: number }>>> => {
      const rows = await categoriesRepo.list()
      return rows.map((c) => ({
        id: c.id,
        slug: c.slug,
        name: c.name,
        image: c.imageUrl ?? "/placeholder.svg",
        productCount: c.productCount ?? 0,
      }))
    },
    ["categories:list"],
    { revalidate: 300, tags: ["categories:list"] },
  )
  const items = await getCategories()
  const { default: CategoriesPageClient } = await import("./client")
  return <CategoriesPageClient initialData={{ items }} />
}
