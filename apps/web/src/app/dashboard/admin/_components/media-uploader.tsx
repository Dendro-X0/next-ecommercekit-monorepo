"use client"

import type React from "react"
import { useEffect, useId, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { uploadsApi } from "@/lib/data/uploads"

type MediaUploaderResult = Readonly<{ url: string; kind: "image" | "video" }>

type MediaUploaderProps = Readonly<{
  onUploaded: (result: MediaUploaderResult) => void
  disabled?: boolean
  accept?: string
  label?: string
  multiple?: boolean
  onUploadedMany?: (results: readonly MediaUploaderResult[]) => void
}>

/**
 * MediaUploader
 * Minimal uploader for images and videos that posts to `/api/uploads` and returns a public URL.
 * @param {MediaUploaderProps} props - onUploaded callback will be called after a successful upload.
 * @returns {React.ReactElement} The uploader UI.
 */
export function MediaUploader({
  onUploaded,
  disabled = false,
  accept = "image/*,video/*",
  label = "Upload image or video",
  multiple = false,
  onUploadedMany,
  onUploadingChange,
}: MediaUploaderProps & {
  readonly onUploadingChange?: (uploading: boolean) => void
}): React.ReactElement {
  const [files, setFiles] = useState<readonly File[]>([])
  const [isUploading, setIsUploading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [progressText, setProgressText] = useState<string>("")
  const inputRef = useRef<HTMLInputElement | null>(null)
  const inputId = useId()
  const [previews, setPreviews] = useState<readonly { file: File; url: string }[]>([])

  const MAX_BYTES: number = 25 * 1024 * 1024 // 25MB (aligned with server)
  const ALLOWED_PREFIX: readonly string[] = ["image/", "video/"] as const

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setError(null)
    const list: FileList | null = e.target.files
    if (!list) {
      setFiles([])
      setPreviews((prev) => {
        prev.forEach((p) => {
          URL.revokeObjectURL(p.url)
        })
        return []
      })
      return
    }
    const arr: File[] = Array.from(list)
    // Client-side validation: filter invalid files early
    const valid: File[] = []
    const problems: string[] = []
    for (const f of arr) {
      const typeOk: boolean = ALLOWED_PREFIX.some((p) => (f.type || "").startsWith(p))
      const sizeOk: boolean = f.size <= MAX_BYTES
      if (!typeOk) problems.push(`${f.name}: unsupported type`)
      if (!sizeOk) problems.push(`${f.name}: exceeds ${(MAX_BYTES / (1024 * 1024)).toFixed(0)}MB`)
      if (typeOk && sizeOk) valid.push(f)
    }
    if (problems.length > 0) setError(problems.join("; "))
    setFiles(valid)
    setPreviews((prev) => {
      // Cleanup previous previews
      prev.forEach((p) => {
        URL.revokeObjectURL(p.url)
      })
      return valid.map((f) => ({ file: f, url: URL.createObjectURL(f) }))
    })
  }

  /** Open the native file picker programmatically. */
  const openPicker = (): void => {
    inputRef.current?.click()
  }

  /** Drag-over handler to allow drop. */
  const handleDragOver = (e: React.DragEvent<HTMLElement>): void => {
    e.preventDefault()
    e.stopPropagation()
  }

  /** Drop handler to accept files from drag-and-drop. */
  const handleDrop = (e: React.DragEvent<HTMLElement>): void => {
    e.preventDefault()
    e.stopPropagation()
    setError(null)
    const dt = e.dataTransfer
    if (!dt || !dt.files || dt.files.length === 0) return
    const arr: File[] = Array.from(dt.files)
    const valid: File[] = []
    const problems: string[] = []
    for (const f of arr) {
      const typeOk: boolean = ALLOWED_PREFIX.some((p) => (f.type || "").startsWith(p))
      const sizeOk: boolean = f.size <= MAX_BYTES
      if (!typeOk) problems.push(`${f.name}: unsupported type`)
      if (!sizeOk) problems.push(`${f.name}: exceeds ${(MAX_BYTES / (1024 * 1024)).toFixed(0)}MB`)
      if (typeOk && sizeOk) valid.push(f)
    }
    if (problems.length > 0) setError(problems.join("; "))
    const chosen = multiple ? valid : valid.slice(0, 1)
    setFiles(chosen)
    setPreviews((prev) => {
      prev.forEach((p) => {
        URL.revokeObjectURL(p.url)
      })
      return chosen.map((f) => ({ file: f, url: URL.createObjectURL(f) }))
    })
  }

  // Upload in small concurrent batches to avoid UI lag
  const uploadInBatches = async (
    toUpload: readonly File[],
    batchSize: number,
  ): Promise<readonly MediaUploaderResult[]> => {
    const results: MediaUploaderResult[] = []
    for (let i = 0; i < toUpload.length; i += batchSize) {
      const batch: readonly File[] = toUpload.slice(i, i + batchSize)
      setProgressText(
        `Uploading ${Math.min(i + batch.length, toUpload.length)}/${toUpload.length}...`,
      )
      const settled = await Promise.allSettled(batch.map((f) => uploadsApi.uploadFile(f)))
      for (const s of settled) {
        if (s.status === "fulfilled") results.push(s.value)
      }
    }
    return results
  }

  const handleUpload = async (): Promise<void> => {
    if (files.length === 0) return
    try {
      setIsUploading(true)
      onUploadingChange?.(true)
      setProgressText(multiple ? "Uploading files..." : "Uploading...")
      const results = await uploadInBatches(files, 3)
      if (multiple) onUploadedMany?.(results)
      else if (results[0]) onUploaded(results[0]!)
      setFiles([])
      setPreviews((prev) => {
        prev.forEach((p) => {
          URL.revokeObjectURL(p.url)
        })
        return []
      })
      setProgressText("Done")
    } catch (e) {
      const message: string = e instanceof Error ? e.message : "Upload failed"
      setError(message)
    } finally {
      setIsUploading(false)
      onUploadingChange?.(false)
      setTimeout(() => setProgressText(""), 1000)
    }
  }

  // Cleanup previews on unmount
  useEffect(() => {
    return () => {
      previews.forEach((p) => {
        URL.revokeObjectURL(p.url)
      })
    }
  }, [previews])

  return (
    <div className="grid gap-2">
      <Label htmlFor={inputId}>{label}</Label>
      <section
        className="relative rounded-md border border-dashed p-4 text-sm text-muted-foreground hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        aria-label="Select or drop files to upload"
      >
        <div className="flex flex-col items-center gap-2">
          <p className="text-center">Drag and drop files here, or click Select files</p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.stopPropagation()
                openPicker()
              }}
              disabled={disabled || isUploading}
            >
              Select files
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={files.length === 0 || disabled || isUploading}
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.stopPropagation()
                void handleUpload()
              }}
            >
              {isUploading
                ? progressText || (multiple ? "Uploading files..." : "Uploading...")
                : multiple
                  ? "Upload"
                  : "Upload"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Accepted: {accept.replace(",", ", ")} • Max size:{" "}
            {(MAX_BYTES / (1024 * 1024)).toFixed(0)}MB
          </p>
          {files.length > 0 && !isUploading && (
            <p className="text-xs text-muted-foreground" aria-live="polite">
              {files.length} file(s) selected
            </p>
          )}
        </div>
        <input
          id={inputId}
          ref={inputRef}
          type="file"
          className="sr-only"
          accept={accept}
          multiple={multiple}
          disabled={disabled || isUploading}
          onChange={handleChange}
        />
      </section>
      {/* keep previews and error inside the container */}
      {previews.length > 0 && (
        <div className="mt-2">
          <Label>Selected files</Label>
          <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {previews.map((p, idx) => (
              <div key={`${p.url}-${idx}`} className="relative rounded border p-2">
                {p.file.type.startsWith("image/") ? (
                  // biome-ignore lint/performance/noImgElement: blob preview URLs are not supported by next/image
                  <img src={p.url} alt={p.file.name} className="h-28 w-full rounded object-cover" />
                ) : (
                  <video className="h-28 w-full rounded object-cover" src={p.url} muted />
                )}
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className="truncate text-xs" title={p.file.name}>
                    {p.file.name}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setFiles((prev) => prev.filter((_, i) => i !== idx))
                      setPreviews((prev) => {
                        const toRemove = prev[idx]
                        if (toRemove) URL.revokeObjectURL(toRemove.url)
                        return prev.filter((_, i) => i !== idx)
                      })
                    }}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
