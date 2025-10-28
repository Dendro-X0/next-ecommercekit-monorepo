import type { MetadataRoute } from "next"

/**
 * Robots.txt generator for SEO. Avoids 404 and declares our sitemap location.
 * Uses NEXT_PUBLIC_APP_URL to ensure correct absolute URLs in all environments.
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl: string = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  const isProd = process.env.NODE_ENV === "production"
  return {
    rules: [
      isProd
        ? {
            userAgent: "*",
            allow: ["/"],
            disallow: ["/api/*", "/dashboard*", "/admin*", "/_next/*"],
          }
        : {
            userAgent: "*",
            allow: ["/"],
            disallow: [],
          },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
