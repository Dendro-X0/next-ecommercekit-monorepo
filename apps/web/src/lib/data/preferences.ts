/**
 * Preferences API client.
 * One export per file: `preferencesApi`.
 */

/** Internal server DTO (do not export). */
type ServerPreferencesDto = Readonly<{
  userId: string
  newsletter: boolean
  notifications: boolean
  smsUpdates: boolean
  theme: "light" | "dark" | "system"
}>

/** Public UI model (decoupled from server shape). */
export type Preferences = Readonly<{
  newsletter: boolean
  notifications: boolean
  smsUpdates: boolean
  theme: "light" | "dark" | "system"
}>

export type UpdatePreferencesInput = Partial<Preferences>

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

const toPreferences = (dto: ServerPreferencesDto): Preferences => ({
  newsletter: !!dto.newsletter,
  notifications: !!dto.notifications,
  smsUpdates: !!dto.smsUpdates,
  theme: dto.theme === "light" || dto.theme === "dark" ? dto.theme : "system",
})

/**
 * preferencesApi
 * - get, update
 */
export const preferencesApi = {
  get: async (): Promise<Preferences> => {
    const res: Response = await fetch(`${API_BASE}/account/preferences`, { credentials: "include" })
    const json = await asJson<ServerPreferencesDto>(res)
    return toPreferences(json)
  },
  update: async (patch: UpdatePreferencesInput): Promise<Preferences> => {
    const res: Response = await fetch(`${API_BASE}/account/preferences`, {
      method: "PATCH",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch),
    })
    const json = await asJson<ServerPreferencesDto>(res)
    return toPreferences(json)
  },
} as const
