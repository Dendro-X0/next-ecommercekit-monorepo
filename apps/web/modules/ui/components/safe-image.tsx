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
}>

const PLACEHOLDER = "/placeholder.svg" as const

export function SafeImage(props: SafeImageProps): ReactElement {
  const { src, fallbackSrc, alt, className, fill, sizes, width, height, priority } = props
  const [failedPrimary, setFailedPrimary] = useState<boolean>(false)
  const [failedFallback, setFailedFallback] = useState<boolean>(false)

  const resolvedSrc: string = failedPrimary
    ? fallbackSrc && !failedFallback
      ? fallbackSrc
      : PLACEHOLDER
    : src || PLACEHOLDER

  // Decide rendering strategy.
  // - Use Next/Image for local paths (beginning with "/") even in development for
  //   responsive sizes and better loading.
  // - Use plain <img> for external hosts during development to avoid dev-only
  //   bundler issues and domain allowlist friction. In production, always use Next/Image.
  const isLocalPath: boolean = useMemo(
    () => typeof resolvedSrc === "string" && resolvedSrc.startsWith("/"),
    [resolvedSrc],
  )
  const usePlainImg: boolean = process.env.NODE_ENV !== "production" && !isLocalPath

  if (usePlainImg) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={resolvedSrc}
        alt={alt || ""}
        className={className}
        onError={() => {
          if (!failedPrimary) setFailedPrimary(true)
          else setFailedFallback(true)
        }}
        style={fill ? { width: "100%", height: "100%", objectFit: "cover" } : undefined}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        decoding="async"
        loading={priority ? "eager" : "lazy"}
      />
    )
  }

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
      onError={() => {
        if (!failedPrimary) setFailedPrimary(true)
        else setFailedFallback(true)
      }}
    />
  )
}
