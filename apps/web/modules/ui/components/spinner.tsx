/**
 * Simple SVG spinner for pending states.
 * - One export per file per repo conventions.
 */
import type { CSSProperties, ReactElement } from "react"

export type SpinnerProps = { readonly size?: number; readonly className?: string }

const DEFAULT_SIZE = 24 as const

export function Spinner({ size = DEFAULT_SIZE, className = "" }: SpinnerProps): ReactElement {
  const dimension: number = size
  const style: CSSProperties = { width: `${dimension}px`, height: `${dimension}px` }
  return (
    <output aria-live="polite" aria-label="Loading" className={className} style={style}>
      <svg className="animate-spin text-muted-foreground" viewBox="0 0 24 24" aria-hidden="true">
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
          fill="none"
        />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
      </svg>
    </output>
  )
}
