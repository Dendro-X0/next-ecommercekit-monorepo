/**
 * Addresses API client.
 * One export per file: `addressesApi`.
 */

import type { Address } from "@/types/address"

/** Server DTO shape (internal). */
type ServerAddressDto = Readonly<{
  id: string
  type: "shipping" | "billing"
  name: string
  street: string
  city: string
  state: string
  zipCode: string
  country: string
  isDefault: boolean
}>

type ServerAddressCreate = {
  type: "shipping" | "billing"
  name: string
  street: string
  city: string
  state: string
  zipCode: string
  country: string
  isDefault: boolean
}

type ServerAddressUpdate = Partial<ServerAddressCreate>

/** RO input for creation. */
export type CreateAddressInput = Readonly<{
  type: "shipping" | "billing"
  firstName: string
  lastName: string
  address: string
  city: string
  state: string
  zipCode: string
  country: string
  isDefault?: boolean
}>

/** RO input for update. */
export type UpdateAddressInput = Readonly<{
  type?: "shipping" | "billing"
  firstName?: string
  lastName?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  country?: string
  isDefault?: boolean
}>

/** Internal: list response mapped to UI. */
type ListAddressesResponse = Readonly<{ items: readonly Address[] }>

type OkResponse = Readonly<{ ok: true }>

const API_BASE: string = "/api/v1"

async function asJson<T>(res: Response): Promise<T> {
  const ct: string | null = res.headers.get("content-type")
  const isJson: boolean = !!ct && ct.includes("application/json")
  const body: unknown = isJson ? await res.json() : undefined
  if (!res.ok) {
    const message: string =
      (body as { readonly error?: string })?.error ?? `Request failed (${res.status})`
    throw new Error(message)
  }
  return body as T
}

const toUiAddress = (dto: ServerAddressDto): Address => {
  const parts: string[] = dto.name.split(" ").filter(Boolean)
  const last: string = parts.length > 1 ? (parts.pop() as string) : ""
  const first: string = parts.join(" ")
  return {
    id: dto.id,
    type: dto.type,
    firstName: first || dto.name,
    lastName: last,
    address: dto.street,
    city: dto.city,
    state: dto.state,
    zipCode: dto.zipCode,
    country: dto.country,
    isDefault: !!dto.isDefault,
  } as const
}

const toServerCreate = (input: CreateAddressInput): ServerAddressCreate => ({
  type: input.type,
  name: `${input.firstName} ${input.lastName}`.trim(),
  street: input.address,
  city: input.city,
  state: input.state,
  zipCode: input.zipCode,
  country: input.country,
  isDefault: !!input.isDefault,
})

const toServerUpdate = (patch: UpdateAddressInput): ServerAddressUpdate => {
  const next: ServerAddressUpdate = {}
  if (patch.type) next.type = patch.type
  if (patch.firstName || patch.lastName) {
    const f = patch.firstName ?? ""
    const l = patch.lastName ?? ""
    next.name = `${f} ${l}`.trim()
  }
  if (patch.address) next.street = patch.address
  if (patch.city) next.city = patch.city
  if (patch.state) next.state = patch.state
  if (patch.zipCode) next.zipCode = patch.zipCode
  if (patch.country) next.country = patch.country
  if (typeof patch.isDefault === "boolean") next.isDefault = patch.isDefault
  return next
}

/**
 * addressesApi
 * - list, create, update, remove, setDefault
 */
export const addressesApi = {
  list: async (): Promise<ListAddressesResponse> => {
    const res: Response = await fetch(`${API_BASE}/account/addresses`, { credentials: "include" })
    const json = await asJson<{ items: ServerAddressDto[] }>(res)
    return { items: (json.items ?? []).map(toUiAddress) } as const
  },
  create: async (input: CreateAddressInput): Promise<Address> => {
    const res: Response = await fetch(`${API_BASE}/account/addresses`, {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(toServerCreate(input)),
    })
    const json = await asJson<ServerAddressDto>(res)
    return toUiAddress(json)
  },
  update: async (id: string, patch: UpdateAddressInput): Promise<Address> => {
    const res: Response = await fetch(`${API_BASE}/account/addresses/${encodeURIComponent(id)}`, {
      method: "PUT",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(toServerUpdate(patch)),
    })
    const json = await asJson<ServerAddressDto>(res)
    return toUiAddress(json)
  },
  remove: async (id: string): Promise<OkResponse> => {
    const res: Response = await fetch(`${API_BASE}/account/addresses/${encodeURIComponent(id)}`, {
      method: "DELETE",
      credentials: "include",
    })
    return asJson<OkResponse>(res)
  },
  setDefault: async (id: string): Promise<OkResponse> => {
    const res: Response = await fetch(
      `${API_BASE}/account/addresses/${encodeURIComponent(id)}/default`,
      {
        method: "POST",
        credentials: "include",
      },
    )
    return asJson<OkResponse>(res)
  },
} as const
