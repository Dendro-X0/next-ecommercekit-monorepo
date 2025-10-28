"use client"

import Link, { type LinkProps } from "next/link"
import * as React from "react"

/**
 * AppLink is a thin wrapper around `next/link` that defaults `prefetch` to `false`.
 * This prevents development-mode prefetch/HMR from compiling large route graphs
 * on hover, which can cause the browser to become unresponsive.
 *
 * Usage:
 *   <AppLink href="/shop" className="...">Shop</AppLink>
 */
/**
 * AppLink is a thin wrapper around `next/link` that defaults `prefetch` to `false`.
 * It forwards refs so it can be used with shadcn/ui `asChild` slots.
 */
export type AppLinkProps = LinkProps &
  React.ComponentPropsWithoutRef<"a"> & {
    readonly prefetch?: boolean | null
  }

export const AppLink = React.forwardRef<React.ElementRef<"a">, AppLinkProps>(function AppLink(
  { prefetch = false, children, ...props },
  ref,
): React.JSX.Element {
  return (
    <Link ref={ref} {...props} prefetch={prefetch}>
      {children}
    </Link>
  )
})
