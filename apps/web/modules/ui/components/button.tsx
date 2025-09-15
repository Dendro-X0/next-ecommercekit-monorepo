"use client"

import { Button as UIButton } from "@repo/ui/button"
import { cva, type VariantProps } from "class-variance-authority"
import * as React from "react"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
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
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

const isFragmentNode = (node: React.ReactNode): boolean =>
  React.isValidElement(node) && node.type === React.Fragment

/**
 * Button shim that wraps @repo/ui Button.
 * - Preserves legacy `asChild` API by mapping to polymorphic `as` under the hood.
 * - Keeps exported `buttonVariants` for styling in other components.
 */
type ButtonShimProps = React.ComponentProps<typeof UIButton> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    className?: string
    type?: "button" | "submit" | "reset"
  }

const Button = React.forwardRef<React.ElementRef<"button">, ButtonShimProps>(
  (rawProps, ref): React.JSX.Element => {
    const { asChild = false, className, children, variant, size, type, ...rest } = rawProps
    if (asChild) {
      if (
        process.env.NODE_ENV !== "production" &&
        (Array.isArray(children) || !React.isValidElement(children) || isFragmentNode(children))
      ) {
        console.warn(
          "[Button asChild] expects exactly one non-Fragment React element child. Received:",
          children,
        )
      }
      const child: React.ReactElement<{ className?: string; children?: React.ReactNode }> =
        React.Children.only(children) as React.ReactElement<{
          className?: string
          children?: React.ReactNode
        }>
      const Comp: React.ElementType = (child.type as React.ElementType) ?? "button"
      const {
        className: childClassName,
        children: childChildren,
        ...childRest
      } = (child.props || {}) as Record<string, unknown>
      const mergedProps: Record<string, unknown> = {
        ...(rest as unknown as Record<string, unknown>),
        ...(childRest as Record<string, unknown>),
      }
      const refProps: Record<string, unknown> = ref
        ? ({ ref: ref as unknown } as Record<string, unknown>)
        : {}
      return (
        <UIButton
          as={Comp}
          variant={variant}
          size={size}
          className={cn(className, childClassName as string | undefined)}
          type={type ?? "button"}
          {...refProps}
          {...mergedProps}
        >
          {childChildren as React.ReactNode}
        </UIButton>
      )
    }
    const refProps: Record<string, unknown> = ref
      ? ({ ref: ref as unknown } as Record<string, unknown>)
      : {}
    return (
      <UIButton
        variant={variant}
        size={size}
        className={className}
        type={type ?? "button"}
        {...refProps}
        {...(rest as unknown as Record<string, unknown>)}
      >
        {children}
      </UIButton>
    )
  },
)
Button.displayName = "Button"

export { Button, buttonVariants }
