/**
 * uploadsApi
 * One export per file. Provides a single method to upload a file to `/api/uploads`.
 */
export const uploadsApi = {
  /**
   * Uploads a single file and returns its public URL and kind (image|video).
   */
  uploadFile: async (file: File): Promise<Readonly<{ url: string; kind: "image" | "video" }>> => {
    const fd: FormData = new FormData()
    fd.set("file", file)
    const res: Response = await fetch("/api/uploads", {
      method: "POST",
      body: fd,
      credentials: "include",
    })
    const ct: string | null = res.headers.get("content-type")
    const data: unknown = ct?.includes("application/json") ? await res.json() : undefined
    if (!res.ok) {
      const message: string =
        (data as { readonly error?: string })?.error ?? `Upload failed (${res.status})`
      throw new Error(message)
    }
    const json = data as { readonly url: string; readonly kind: "image" | "video" }
    return { url: json.url, kind: json.kind } as const
  },
} as const
