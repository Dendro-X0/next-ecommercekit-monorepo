import type { ContactFormData } from "@/types/contact"

const baseContact = "/api/v1/contact" as const

type SubmitResponse = Readonly<{ ok: boolean }>

async function submitContact(input: ContactFormData): Promise<SubmitResponse> {
  const res = await fetch(baseContact, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  if (!res.ok && res.status !== 202)
    throw new Error(`Failed to submit contact message (${res.status})`)
  // In our route we return { ok: true } with 202
  const contentType: string | null = res.headers.get("content-type")
  if (contentType?.includes("application/json")) {
    const data = (await res.json()) as SubmitResponse
    return data
  }
  return { ok: true } as const
}

export const contactApi = { submitContact } as const
