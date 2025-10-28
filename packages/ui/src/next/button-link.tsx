"use client"

import * as React from "react"
import { Button } from "../button"
import { Link } from "./link"

type ButtonPolymorphicProps = Parameters<typeof Button>[0]
type ButtonLinkProps = Omit<ButtonPolymorphicProps, "as"> & React.ComponentProps<typeof Link>

/**
 * ButtonLink composes the core Button with Next.js Link via the polymorphic `as` API.
 * - Forwards ref to the underlying anchor element.
 * - Accepts all Next Link props (href, prefetch, replace, etc.) and Button variants/sizes.
 */
export const ButtonLink = React.forwardRef<HTMLAnchorElement, ButtonLinkProps>(function ButtonLink(
  { ...props },
  ref,
) {
  return <Button as={Link} ref={ref} {...props} />
})
