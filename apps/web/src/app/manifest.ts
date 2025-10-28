import type { MetadataRoute } from "next"

/**
 * Minimal web app manifest to improve metadata coverage and avoid 404s.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ModularShop",
    short_name: "ModShop",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#000000",
    description: "An end-to-end, production-ready foundation for modern commerce.",
    icons: [
      { src: "/favicon.ico", sizes: "48x48", type: "image/x-icon" },
      { src: "/next-ecommerce-starter.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  }
}
