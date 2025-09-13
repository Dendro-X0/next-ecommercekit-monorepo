import type { Locale } from "./locale"

export type NamespaceCommon = Readonly<{
  loading: string
  error: string
  save: string
  cancel: string
}>

export type NamespaceNav = Readonly<{
  home: string
  shop: string
  cart: string
  admin: string
}>

export type Messages = Readonly<{
  common: NamespaceCommon
  nav: NamespaceNav
}>

export type Translations = Readonly<Record<Locale, Messages>>

export type TParams = Readonly<Record<string, string | number>>

export type TFunc = (key: string, params?: TParams) => string
