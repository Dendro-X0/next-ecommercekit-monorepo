"use client"

import Image from "next/image"
import { type ReactElement, useMemo, useState } from "react"

/**
 * SafeImage renders a resilient image element for product cards and grids.
 * - In production, it uses Next/Image by default for performance.
 * - In development, it falls back to a plain <img> by default to avoid crashes
 *   related to domain allowlists or dev bundler image handling.
 * - It always fails over to a placeholder when the source cannot be loaded.
 */
/**
 * Props for SafeImage
 */
export type SafeImageProps = Readonly<{
  src: string
  /** Optional secondary source to try if the primary src fails to load */
  fallbackSrc?: string
  alt: string
  className?: string
  fill?: boolean
  sizes?: string
  width?: number
  height?: number
  /**
   * When true, hint to the browser/Next.js that this image is above the fold and
   * should be loaded with high priority. In development (plain <img> mode), we
   * map this to loading="eager"; in production (next/image), we pass `priority`.
   */
  priority?: boolean
  /** Explicitly control fetch priority where supported (Next.js 16+, modern browsers). */
  fetchPriority?: "auto" | "low" | "high"
}>

const PLACEHOLDER = "/placeholder.svg" as const

export function SafeImage(props: SafeImageProps): ReactElement {
  const { src, fallbackSrc, alt, className, fill, sizes, width, height, priority, fetchPriority } =
    props
  const [failedPrimary, setFailedPrimary] = useState<boolean>(false)
  const [failedFallback, setFailedFallback] = useState<boolean>(false)

  const resolvedSrc: string = failedPrimary
    ? fallbackSrc && !failedFallback
      ? fallbackSrc
      : PLACEHOLDER
    : src || PLACEHOLDER

  // Decide rendering strategy.
  // - Use Next/Image for all cases to satisfy lint and ensure consistency.
  // - For external hosts in development, set `unoptimized` to avoid domain allowlist friction.
  const isLocalPath: boolean = useMemo(
    () => typeof resolvedSrc === "string" && resolvedSrc.startsWith("/"),
    [resolvedSrc],
  )
  const unoptimized: boolean = process.env.NODE_ENV !== "production" && !isLocalPath

  return (
    <Image
      src={resolvedSrc}
      alt={alt || ""}
      className={className}
      fill={fill}
      sizes={sizes}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      priority={Boolean(priority)}
      fetchPriority={fetchPriority ?? (priority ? "high" : undefined)}
      unoptimized={unoptimized}
      onError={() => {
        if (!failedPrimary) setFailedPrimary(true)
        else setFailedFallback(true)
      }}
    />
  )
}
