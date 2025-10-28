/**
 * Address type for account address management forms.
 */
export interface Address {
  readonly id: string
  readonly type: "shipping" | "billing"
  readonly firstName: string
  readonly lastName: string
  readonly address: string
  readonly city: string
  readonly state: string
  readonly zipCode: string
  readonly country: string
  readonly isDefault: boolean
}
