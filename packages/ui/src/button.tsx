"use client"

import { cva, type VariantProps } from "class-variance-authority"
import * as React from "react"
import { cn } from "./utils/cn"
import type { PolymorphicComponentProp, PolymorphicRef } from "./utils/polymorphic"

// Internal utils are colocated within the package under src/utils

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        destructive:
          "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary: "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md gap-1.5 px-3",
        lg: "h-10 rounded-md px-6",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

// Polymorphic helpers live in utils/polymorphic

type ButtonProps<E extends React.ElementType = "button"> = PolymorphicComponentProp<
  E,
  VariantProps<typeof buttonVariants> & {
    loading?: boolean
  }
>

/**
 * Polymorphic Button component. Default element is `button`, but can render as any element via the `as` prop.
 * - For accessibility, when rendering as non-button, we propagate `aria-disabled` and `data-disabled` instead of `disabled`.
 * - Ref is forwarded to the underlying rendered element.
 */
function InnerButton<E extends React.ElementType = "button">(
  { as, className, variant, size, loading = false, children, ...props }: ButtonProps<E>,
  ref: PolymorphicRef<E>,
): React.JSX.Element {
  const Comp: React.ElementType = (as ?? "button") as React.ElementType
  const isNativeButton: boolean = Comp === "button"
  const disabled: boolean = (props as React.ComponentPropsWithoutRef<"button">).disabled || loading
  // Dev-only a11y guard for icon-sized buttons
  if (process.env.NODE_ENV !== "production") {
    try {
      const p = props as Record<string, unknown>
      const isIconSize = size === "icon"
      const hasName =
        typeof p["aria-label"] === "string" ||
        typeof p.title === "string" ||
        typeof p["aria-labelledby"] === "string"
      if (isIconSize && !hasName) {
        // eslint-disable-next-line no-console
        console.warn(
          '[a11y] <Button size="icon"> is missing an accessible name. Add aria-label, title, or aria-labelledby.',
        )
      }
    } catch {
      /* no-op */
    }
  }
  const sharedProps: Record<string, unknown> = {
    ref,
    "data-slot": "button",
    className: cn(buttonVariants({ variant, size }), className),
  }
  if (isNativeButton) {
    return (
      <Comp {...sharedProps} disabled={disabled} {...props}>
        {children}
      </Comp>
    )
  }
  return (
    <Comp
      {...sharedProps}
      aria-disabled={disabled || undefined}
      data-disabled={disabled ? "" : undefined}
      {...props}
    >
      {children}
    </Comp>
  )
}

type ButtonComponent = <E extends React.ElementType = "button">(
  props: ButtonProps<E> & { ref?: PolymorphicRef<E> },
) => React.JSX.Element

const _Button = React.forwardRef<HTMLButtonElement, ButtonProps<"button">>(
  InnerButton as unknown as React.ForwardRefRenderFunction<
    HTMLButtonElement,
    ButtonProps<"button">
  >,
) as unknown as ButtonComponent & { displayName?: string }
_Button.displayName = "Button"
export const Button = _Button
export { buttonVariants }
