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
  // Emit source maps for client code in production so errors map to source.
  // Note: This exposes source maps publicly. If you prefer private maps,
  // set devtool to "hidden-source-map" below and upload maps to your APM.
  productionBrowserSourceMaps: true,
  webpack: (config, { dev, isServer }) => {
    // Ensure client bundles emit full source maps with proper mappings in prod.
    if (!dev && !isServer) {
      config.devtool = "source-map"
    }
    // Force singletons for React and TanStack Query across monorepo packages.
    // This avoids duplicate module instances that break context lookups
    // (e.g., "No QueryClient set" when providers/hooks resolve to different copies).
    config.resolve = config.resolve || {}
    const alias: Record<string, string> = {
      "@tanstack/react-query$": require.resolve("@tanstack/react-query"),
    }
    if (dev) {
      alias["react$"] = require.resolve("react")
      alias["react-dom$"] = require.resolve("react-dom")
      alias["react-dom/client"] = require.resolve("react-dom/client")
      alias["react-dom/server"] = require.resolve("react-dom/server")
      alias["react-dom/server.edge"] = require.resolve("react-dom/server")
      alias["react-dom/server.browser"] = require.resolve("react-dom/server")
      alias["react/jsx-runtime"] = require.resolve("react/jsx-runtime")
      alias["react/jsx-dev-runtime"] = require.resolve("react/jsx-dev-runtime")
    } else {
      // In production, force all imports to Next's compiled React to avoid version mismatches (#527)
      alias["react$"] = require.resolve("next/dist/compiled/react")
      alias["react-dom$"] = require.resolve("next/dist/compiled/react-dom")
      alias["react-dom/client"] = require.resolve("next/dist/compiled/react-dom/client")
      alias["react-dom/server"] = require.resolve("next/dist/compiled/react-dom/server")
      alias["react-dom/server.edge"] = require.resolve("next/dist/compiled/react-dom/server")
      alias["react-dom/server.browser"] = require.resolve("next/dist/compiled/react-dom/server")
      alias["react/jsx-runtime"] = require.resolve("next/dist/compiled/react/jsx-runtime")
      alias["react/jsx-dev-runtime"] = require.resolve("next/dist/compiled/react/jsx-dev-runtime")
    }
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      ...alias,
    }
    return config
  },
  // Note: lucide-react already tree-shakes well; per-icon subpath imports are not portable across versions.
  // Removing the lucide modularizeImports rewrite to avoid 'lucide-react/icons/*' resolution errors.
  // Explicitly set the monorepo root for Turbopack to silence workspace-root warnings
  turbopack: {
    root: path.resolve(__dirname, "../.."),
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
