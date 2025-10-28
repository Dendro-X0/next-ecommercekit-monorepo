export interface SubNavItem {
  name: string
  href: string
  description: string
  image?: string
}

export interface MainNavItem {
  name: string
  href: string
  hasDropdown: boolean
  items: SubNavItem[]
}

export interface QuickFilter {
  name: string
  value: string
}
