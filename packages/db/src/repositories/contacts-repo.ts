import { randomUUID } from "node:crypto"
import { desc, eq } from "drizzle-orm"
import { db } from "../db"
import { contacts } from "../schema/contacts"

export type ContactRecord = Readonly<{
  id: string
  name: string
  email: string
  subject: string
  message: string
  phone: string | null
  ip: string
  createdAt: string // ISO
}>

export type CreateContactInput = Readonly<{
  name: string
  email: string
  subject: string
  message: string
  phone?: string | null
  ip: string
}>

type ContactRow = typeof contacts.$inferSelect

function mapRow(r: ContactRow): ContactRecord {
  return {
    id: r.id,
    name: r.name,
    email: r.email,
    subject: r.subject,
    message: r.message,
    phone: r.phone ?? null,
    ip: r.ip,
    createdAt: (r.createdAt as Date).toISOString(),
  } as const
}

async function create(input: CreateContactInput): Promise<ContactRecord> {
  const id = randomUUID()
  await db.insert(contacts).values({
    id,
    name: input.name,
    email: input.email,
    subject: input.subject,
    message: input.message,
    phone: input.phone ?? undefined,
    ip: input.ip,
  })
  const [row] = await db.select().from(contacts).where(eq(contacts.id, id)).limit(1)
  return mapRow(row)
}

async function listRecent(limit = 100): Promise<readonly ContactRecord[]> {
  const rows = await db.select().from(contacts).orderBy(desc(contacts.createdAt)).limit(limit)
  return rows.map(mapRow)
}

const repo = { create, listRecent } as const
export default repo
