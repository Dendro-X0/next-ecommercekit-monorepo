"use client"

import { type ReactElement, useEffect, useState } from "react"

/**
 * GlobalCrashOverlay: captures window errors and unhandled rejections and
 * shows a small in-page overlay with the error message so you can see failures
 * even when the app frame is blank or DevTools cannot open.
 */
export function GlobalCrashOverlay(): ReactElement | null {
  const [err, setErr] = useState<Readonly<{ message: string; stack?: string }>>()

  useEffect(() => {
    const onError = (e: ErrorEvent): void => {
      const message = typeof e.message === "string" ? e.message : "Unknown error"
      const stack = e.error && typeof e.error.stack === "string" ? e.error.stack : undefined
      setErr({ message, stack })
    }
    const onRejection = (e: PromiseRejectionEvent): void => {
      const reason: unknown = e.reason
      const message =
        reason instanceof Error
          ? reason.message
          : typeof reason === "string"
            ? reason
            : "Unhandled rejection"
      const stack =
        reason instanceof Error && typeof reason.stack === "string" ? reason.stack : undefined
      setErr({ message, stack })
    }
    window.addEventListener("error", onError)
    window.addEventListener("unhandledrejection", onRejection)
    return () => {
      window.removeEventListener("error", onError)
      window.removeEventListener("unhandledrejection", onRejection)
    }
  }, [])

  if (!err) return null

  const copy = async (): Promise<void> => {
    try {
      const text = `${err.message}\n\n${err.stack ?? "<no stack>"}`
      await navigator.clipboard?.writeText?.(text)
    } catch {}
  }

  return (
    <output
      aria-live="assertive"
      className="fixed bottom-3 left-3 z-[9999] max-w-[90vw] rounded-md border border-red-300 bg-red-50 p-3 text-red-800 shadow-lg dark:border-red-800 dark:bg-red-950 dark:text-red-200"
    >
      <div className="font-semibold mb-1">App error</div>
      <div className="text-sm whitespace-pre-wrap break-words max-h-48 overflow-auto">
        {err.message}
        {err.stack ? `\n\n${err.stack}` : ""}
      </div>
      <button
        type="button"
        onClick={copy}
        className="mt-2 inline-flex items-center rounded bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700 focus-visible:outline-none"
      >
        Copy details
      </button>
    </output>
  )
}
