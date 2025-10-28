import { randomUUID } from "node:crypto"
import { and, desc, eq } from "drizzle-orm"
import { db } from "../db"
import { addresses } from "../schema/addresses"

export type AddressDTO = Readonly<{
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

export type CreateAddressInput = Readonly<{
  type: "shipping" | "billing"
  name: string
  street: string
  city: string
  state: string
  zipCode: string
  country: string
  isDefault?: boolean
}>

export type UpdateAddressInput = Readonly<{
  type?: "shipping" | "billing"
  name?: string
  street?: string
  city?: string
  state?: string
  zipCode?: string
  country?: string
  isDefault?: boolean
}>

function mapRow(r: typeof addresses.$inferSelect): AddressDTO {
  return {
    id: r.id,
    type: r.type as "shipping" | "billing",
    name: r.name,
    street: r.street,
    city: r.city,
    state: r.state,
    zipCode: r.zipCode,
    country: r.country,
    isDefault: !!r.isDefault,
  } as const
}

async function listByUser(userId: string): Promise<readonly AddressDTO[]> {
  const rows = await db
    .select()
    .from(addresses)
    .where(eq(addresses.userId, userId))
    .orderBy(desc(addresses.isDefault), desc(addresses.createdAt))
  return rows.map(mapRow)
}

async function byId(userId: string, id: string): Promise<AddressDTO | null> {
  const rows = await db
    .select()
    .from(addresses)
    .where(and(eq(addresses.userId, userId), eq(addresses.id, id)))
    .limit(1)
  if (!rows.length) return null
  return mapRow(rows[0])
}

async function create(userId: string, input: CreateAddressInput): Promise<AddressDTO> {
  const id: string = randomUUID()
  const row = (
    await db
      .insert(addresses)
      .values({
        id,
        userId,
        type: input.type,
        name: input.name,
        street: input.street,
        city: input.city,
        state: input.state,
        zipCode: input.zipCode,
        country: input.country,
        isDefault: input.isDefault ?? false,
      })
      .returning()
  )[0]
  if (input.isDefault) {
    await setDefault(userId, row.id)
    const updated = await byId(userId, row.id)
    if (updated) return updated
  }
  return mapRow(row)
}

async function update(
  userId: string,
  id: string,
  patch: UpdateAddressInput,
): Promise<AddressDTO | null> {
  const fields: Partial<typeof addresses.$inferInsert> = {}
  if (typeof patch.type === "string") fields.type = patch.type
  if (typeof patch.name === "string") fields.name = patch.name
  if (typeof patch.street === "string") fields.street = patch.street
  if (typeof patch.city === "string") fields.city = patch.city
  if (typeof patch.state === "string") fields.state = patch.state
  if (typeof patch.zipCode === "string") fields.zipCode = patch.zipCode
  if (typeof patch.country === "string") fields.country = patch.country

  if (Object.keys(fields).length > 0) {
    const row = (
      await db
        .update(addresses)
        .set(fields)
        .where(and(eq(addresses.userId, userId), eq(addresses.id, id)))
        .returning()
    )[0]
    if (!row) return null
  }

  if (patch.isDefault === true) {
    await setDefault(userId, id)
  }

  const current = await byId(userId, id)
  return current
}

async function remove(userId: string, id: string): Promise<boolean> {
  const res = await db
    .delete(addresses)
    .where(and(eq(addresses.userId, userId), eq(addresses.id, id)))
    .returning({ id: addresses.id })
  return res.length > 0
}

async function setDefault(userId: string, id: string): Promise<boolean> {
  const row = await byId(userId, id)
  if (!row) return false
  const type = row.type
  // Clear existing defaults for this user and type
  await db
    .update(addresses)
    .set({ isDefault: false })
    .where(and(eq(addresses.userId, userId), eq(addresses.type, type)))
  // Set selected as default
  await db
    .update(addresses)
    .set({ isDefault: true })
    .where(and(eq(addresses.userId, userId), eq(addresses.id, id)))
  return true
}

const addressesRepo = {
  listByUser,
  byId,
  create,
  update,
  remove,
  setDefault,
} as const

export default addressesRepo
