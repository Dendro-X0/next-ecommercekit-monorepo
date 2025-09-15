import type { Metadata } from "next"
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
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "ModularShop",
  description: "An end-to-end, production-ready foundation for modern commerce.",
  alternates: {
    languages: {
      en: "/",
      es: "/es",
    },
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        data-minimal-boot={minimalBoot ? "true" : "false"}
        data-animations-disabled={animationsDisabled ? "true" : "false"}
        data-products-disabled={productsDisabled ? "true" : "false"}
        data-ui-templates={uiTemplates ? "true" : "false"}
      >
        {(process.env.NODE_ENV !== "production" ||
          (process.env.NEXT_PUBLIC_ENABLE_PROD_DIAGNOSTICS ?? "false").toLowerCase() ===
            "true") && (
          <>
            <script>
              {`(function(){if(window.__GLOBAL_ERROR_LISTENER__)return;window.__GLOBAL_ERROR_LISTENER__=true;function show(m,s){try{var id='__crash_info';var el=document.getElementById(id);if(!el){el=document.createElement('div');el.id=id;el.style.position='fixed';el.style.bottom='8px';el.style.left='8px';el.style.zIndex='2147483647';el.style.maxWidth='90vw';el.style.background='#fee';el.style.border='1px solid #fcc';el.style.color='#900';el.style.padding='8px';el.style.font='12px/1.4 ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto';el.style.whiteSpace='pre-wrap';el.style.wordBreak='break-word';document.body.appendChild(el);}el.textContent=(m||'Unknown error')+(s?'\n\n'+s:'');}catch(e){}}window.addEventListener('error',function(e){var m=e.message;var s=e.error&&e.error.stack;show(m,s);});window.addEventListener('unhandledrejection',function(e){var r=e.reason;var m=r&&r.message?r.message:(typeof r==='string'?r:'Unhandled rejection');var s=r&&r.stack;show(m,s);})();`}
            </script>
            <GlobalCrashOverlay />
            <script>
              {`(function(){try{if(window.__LONGTASK_WATCH__)return;window.__LONGTASK_WATCH__=true;if('PerformanceObserver'in window){var id='__perf_info';function box(){var el=document.getElementById(id);if(!el){el=document.createElement('div');el.id=id;el.style.position='fixed';el.style.bottom='8px';el.style.left='8px';el.style.zIndex='2147483647';el.style.maxWidth='90vw';el.style.background='#eef';el.style.border='1px solid #ccf';el.style.color='#003';el.style.padding='6px 8px';el.style.font='12px/1.4 ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto';el.style.whiteSpace='pre-wrap';el.style.wordBreak='break-word';document.body.appendChild(el);}return el}var count=0;var obs=new PerformanceObserver(function(l){var e=l.getEntries();count+=e.length;var last=e[e.length-1];var dur=last?Math.round(last.duration):0;var el=box();el.textContent='Long tasks: '+count+' last: '+dur+'ms';});try{obs.observe({entryTypes:['longtask']});}catch(e){}}}catch(e){}})();`}
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
              <div className="min-h-screen flex flex-col">{children}</div>
            </ClientProviders>
          ) : (
            <FullClientProviders>
              <div className="min-h-screen flex flex-col">{children}</div>
            </FullClientProviders>
          )}
        </ThemeProvider>
      </body>
    </html>
  )
}
