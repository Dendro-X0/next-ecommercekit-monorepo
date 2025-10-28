import type * as React from "react"

export type ElementType = keyof React.JSX.IntrinsicElements | React.JSXElementConstructor<unknown>

export type AsProp<E extends React.ElementType> = { as?: E }

export type PropsToOmit<E extends React.ElementType, P> = keyof (AsProp<E> & P)

export type PolymorphicComponentProp<E extends React.ElementType, P> = React.PropsWithChildren<
  P & AsProp<E>
> &
  Omit<React.ComponentPropsWithoutRef<E>, PropsToOmit<E, P>>

export type PolymorphicRef<E extends React.ElementType> = React.ComponentPropsWithRef<E>["ref"]
