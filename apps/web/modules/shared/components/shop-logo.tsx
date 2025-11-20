import type { JSX } from "react"

const SHOP_LOGO_DEFAULT_SIZE = 24 as const
const SHOP_LOGO_VIEWBOX_SIZE = 32 as const
const SHOP_LOGO_CORNER_RADIUS = 8 as const
const SHOP_LOGO_BACKGROUND_OPACITY = 0.08 as const

export type ShopLogoProps = Readonly<{
  size?: number
}>

export function ShopLogo({ size = SHOP_LOGO_DEFAULT_SIZE }: ShopLogoProps): JSX.Element {
  const dimension: number = size
  return (
    <svg
      width={dimension}
      height={dimension}
      viewBox={`0 0 ${SHOP_LOGO_VIEWBOX_SIZE} ${SHOP_LOGO_VIEWBOX_SIZE}`}
      aria-hidden="true"
      focusable="false"
      className="text-black dark:text-white"
    >
      <rect
        width={SHOP_LOGO_VIEWBOX_SIZE}
        height={SHOP_LOGO_VIEWBOX_SIZE}
        rx={SHOP_LOGO_CORNER_RADIUS}
        fill="currentColor"
        opacity={SHOP_LOGO_BACKGROUND_OPACITY}
      />
      <path
        d="M9.5 13.5C9.5 12.672 10.172 12 11 12h10c.828 0 1.5.672 1.5 1.5v8.25c0 .69-.56 1.25-1.25 1.25H10.75C10.06 23 9.5 22.44 9.5 21.75V13.5z"
        fill="currentColor"
      />
      <path
        d="M12.5 13a3 3 0 0 1 7 0"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </svg>
  )
}
