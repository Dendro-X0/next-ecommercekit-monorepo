"use client"

import NextLink from "next/link"
import * as React from "react"

type LinkProps = React.ComponentProps<typeof NextLink>

/**
 * Link wrapper that forwards ref to the underlying anchor.
 * Keeps a single place to adjust default behaviors/styles if needed later.
 */
export const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  props: LinkProps,
  ref: React.Ref<HTMLAnchorElement>,
) {
  return <NextLink ref={ref} {...props} />
})
