import type { NextConfig } from "next"
import path from "path"

// Enable bundle analyzer only when ANALYZE=true to avoid overhead in normal builds.
// Run: ANALYZE=true pnpm --filter web build
const withBundleAnalyzer =
  process.env.ANALYZE === "true"
    ? // eslint-disable-next-line @typescript-eslint/no-var-requires
      require("@next/bundle-analyzer")({ enabled: true })
    : (config: NextConfig) => config

const nextConfig: NextConfig = {
  eslint: {
    // Allow production builds to complete even if there are ESLint warnings/errors.
    // We are running in a Safe Mode and will address lint issues separately.
    ignoreDuringBuilds: true,
  },
  i18n: {
    /**
     * Minimal i18n scaffold. Add more locales as needed.
     * Default locale remains unprefixed (e.g., "/" for English);
     * non-default locales are available under subpaths (e.g., "/es").
     */
    locales: ["en", "es"],
    defaultLocale: "en",
  },
  transpilePackages: [
    "@repo/ui",
    "@repo/auth",
    "@repo/db",
    "@repo/api",
    "@repo/mail",
    "@repo/emails",
    "@repo/payments",
    "@repo/storage",
  ],
  images: {
    loaderFile: "./src/lib/image-loader.ts",
    remotePatterns: (() => {
      const patterns: Array<{ protocol: "http" | "https"; hostname: string }> = [
        { protocol: "https", hostname: "picsum.photos" },
      ]
      const base = process.env.S3_PUBLIC_BASE_URL
      if (base) {
        try {
          const u = new URL(base)
          patterns.push({
            protocol: (u.protocol.replace(":", "") as "http" | "https") || "https",
            hostname: u.hostname,
          })
        } catch {
          // ignore invalid URL
        }
      }
      // Cloudinary
      patterns.push({ protocol: "https", hostname: "res.cloudinary.com" })
      return patterns
    })(),
    formats: ["image/avif", "image/webp"],
    deviceSizes: [320, 420, 768, 1024, 1280, 1536],
    imageSizes: [16, 24, 32, 48, 64, 96, 128, 256],
    // Optional: allow disabling optimization on Hobby if needed
    // Set NEXT_UNOPTIMIZED_IMAGES=true at build time to bypass runtime image optimization
    unoptimized: process.env.NEXT_UNOPTIMIZED_IMAGES === "true",
  },
}

export default withBundleAnalyzer(nextConfig)
