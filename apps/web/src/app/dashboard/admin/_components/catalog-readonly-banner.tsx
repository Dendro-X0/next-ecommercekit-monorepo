"use client"

import { useQuery } from "@tanstack/react-query"
import { Info } from "lucide-react"
import type React from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { adminApi } from "@/lib/data/admin-api"

export function CatalogReadOnlyBanner(): React.ReactElement | null {
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "catalog-meta"],
    queryFn: async () => adminApi.catalogMeta(),
    staleTime: 60_000,
  })

  if (isLoading || error || !data) return null
  if (data.provider === "native") return null

  return (
    <Alert>
      <Info />
      <AlertTitle>Read-only catalog provider</AlertTitle>
      <AlertDescription>
        Your catalog provider is <strong>{data.provider}</strong>, so product create/edit/delete is disabled.
      </AlertDescription>
    </Alert>
  )
}
