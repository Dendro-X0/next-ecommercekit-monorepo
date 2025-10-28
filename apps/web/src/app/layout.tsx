import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { GlobalCrashOverlay } from "modules/ui/components/global-crash-overlay"
import { ClientProviders } from "@/components/providers/client-providers"
import { FullClientProviders } from "@/components/providers/full-client-providers"
import { ThemeProvider } from "@/components/theme/theme-provider"
import { animationsDisabled, minimalBoot, productsDisabled, uiTemplates } from "@/lib/safe-mode"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "optional",
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "optional",
})

export const metadata: Metadata = {
  // Use a canonical base so absolute URLs are generated correctly in metadata and sitemaps
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: "ModularShop",
  description: "An end-to-end, production-ready foundation for modern commerce.",
  applicationName: "ModularShop",
  openGraph: {
    title: "ModularShop",
    description: "An end-to-end, production-ready foundation for modern commerce.",
    url: "/",
    siteName: "ModularShop",
    images: [
      {
        url: "/next-ecommerce-starter.png",
        width: 1200,
        height: 630,
        alt: "Next.js E‑Commerce Starterkit",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ModularShop",
    description: "An end-to-end, production-ready foundation for modern commerce.",
    images: ["/next-ecommerce-starter.png"],
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  // Page-specific canonicals are provided at the route level.
}

export const viewport: Viewport = {
  themeColor: "#000000",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Best-effort dynamic preconnects for common image CDNs
  const preconnectHrefs: string[] = (() => {
    const out: string[] = []
    const base = process.env.S3_PUBLIC_BASE_URL
    if (base) {
      try {
        const u = new URL(base)
        out.push(`${u.protocol}//${u.hostname}`)
      } catch {
        /* ignore */
      }
    }
    return Array.from(new Set(out))
  })()
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {preconnectHrefs.map((href) => (
          <link key={href} rel="preconnect" href={href} crossOrigin="anonymous" />
        ))}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        data-minimal-boot={minimalBoot ? "true" : "false"}
        data-animations-disabled={animationsDisabled ? "true" : "false"}
        data-products-disabled={productsDisabled ? "true" : "false"}
        data-ui-templates={uiTemplates ? "true" : "false"}
      >
        {/* Skip link for accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[9999] rounded bg-black px-3 py-2 text-white"
        >
          Skip to main content
        </a>
        {(process.env.NODE_ENV !== "production" ||
          (process.env.NEXT_PUBLIC_ENABLE_PROD_DIAGNOSTICS ?? "false").toLowerCase() ===
            "true") && (
          <>
            <script>
              {`(function(){if(window.__GLOBAL_ERROR_LISTENER__)return;window.__GLOBAL_ERROR_LISTENER__=true;function show(m,s){try{var id='__crash_info';var el=document.getElementById(id);if(!el){el=document.createElement('div');el.id=id;el.style.position='fixed';el.style.bottom='8px';el.style.left='8px';el.style.zIndex='2147483647';el.style.maxWidth='90vw';el.style.background='#fee';el.style.border='1px solid #fcc';el.style.color='#900';el.style.padding='8px';el.style.font='12px/1.4 ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto';el.style.whiteSpace='pre-wrap';el.style.wordBreak='break-word';document.body.appendChild(el);}el.textContent=(m||'Unknown error')+(s?'\\n\\n'+s:'');}catch(e){}}window.addEventListener('error',function(e){var m=e.message;var s=e.error&&e.error.stack;show(m,s);});window.addEventListener('unhandledrejection',function(e){var r=e.reason;var m=r&&r.message?r.message:(typeof r==='string'?r:'Unhandled rejection');var s=r&&r.stack;show(m,s);})();`}
            </script>
            <GlobalCrashOverlay />
            <script>
              {`(function(){try{if(window.__LONGTASK_WATCH__)return;window.__LONGTASK_WATCH__=true;if('PerformanceObserver'in window){var id='__perf_info';function box(){var el=document.getElementById(id);if(!el){el=document.createElement('div');el.id=id;el.style.position='fixed';el.style.bottom='8px';el.style.left='8px';el.style.zIndex='2147483647';el.style.maxWidth='90vw';el.style.background='#eef';el.style.border='1px solid #ccf';el.style.color='#003';el.style.padding='6px 8px';el.style.font='12px/1.4 ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto';el.style.whiteSpace='pre-wrap';el.style.wordBreak='break-word';document.body.appendChild(el);}return el}var count=0;var obs=new PerformanceObserver(function(l){var e=l.getEntries();count+=e.length;var last=e[e.length-1];var dur=last?Math.round(last.duration):0;var el=box();el.textContent='Long tasks: '+count+' last: '+dur+'ms';});try{obs.observe({entryTypes:['longtask']});}catch(e){}}}catch(e){}})();`}
            </script>
            <script>
              {`(function(){try{if(window.__CLS_WATCH__)return;window.__CLS_WATCH__=true;if('PerformanceObserver'in window){var id='__cls_info';function box(){var el=document.getElementById(id);if(!el){el=document.createElement('div');el.id=id;el.style.position='fixed';el.style.bottom='40px';el.style.left='8px';el.style.zIndex='2147483647';el.style.background='#efe';el.style.border='1px solid #9c9';el.style.color='#030';el.style.padding='6px 8px';el.style.font='12px/1.4 ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto';el.style.whiteSpace='pre-wrap';el.style.wordBreak='break-word';document.body.appendChild(el);}return el}var cls=0;var obs=new PerformanceObserver(function(list){for(const entry of list.getEntries()){if(entry.hadRecentInput)continue;cls+=entry.value;var el=box();el.textContent='CLS: '+cls.toFixed(3);if(entry.sources){entry.sources.slice(0,3).forEach(function(src){try{var n=src.node;if(!n||!n.getBoundingClientRect)return;var r=n.getBoundingClientRect();var hl=document.createElement('div');hl.style.position='fixed';hl.style.pointerEvents='none';hl.style.left=r.left+'px';hl.style.top=r.top+'px';hl.style.width=r.width+'px';hl.style.height=r.height+'px';hl.style.outline='2px solid rgba(255,0,0,.7)';hl.style.background='rgba(255,0,0,.1)';hl.style.zIndex='2147483647';document.body.appendChild(hl);setTimeout(function(){try{document.body.removeChild(hl)}catch(e){}},700);}catch(e){}});}console.warn('[CLS]', entry.value, entry);}});try{obs.observe({type:'layout-shift', buffered:true});}catch(e){}}}catch(e){}})();`}
            </script>
          </>
        )}
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {minimalBoot ? (
            <ClientProviders>
              {/* biome-ignore lint/correctness/useUniqueElementIds: stable anchor id for skip link */}
              <main id="main-content" className="min-h-screen flex flex-col">
                {children}
              </main>
            </ClientProviders>
          ) : (
            <FullClientProviders>
              {/* biome-ignore lint/correctness/useUniqueElementIds: stable anchor id for skip link */}
              <main id="main-content" className="min-h-screen flex flex-col">
                {children}
              </main>
            </FullClientProviders>
          )}
        </ThemeProvider>
      </body>
    </html>
  )
}
