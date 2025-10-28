import type { NextRequest } from "next/server"

export const runtime = "nodejs"

export async function GET(req: NextRequest): Promise<Response> {
  try {
    const origin: string = new URL(req.url).origin
    const cookie = req.headers.get("cookie") ?? ""
    const res = await fetch(`${origin}/api/auth/two-factor/view-backup-codes`, {
      method: "POST",
      headers: { cookie, "content-type": "application/json" },
      body: JSON.stringify({}),
      credentials: "include",
      cache: "no-store",
    })
    const body = await res.text()
    return new Response(body, {
      status: res.status,
      headers: { "content-type": res.headers.get("content-type") ?? "application/json" },
    })
  } catch (e) {
    const message: string = e instanceof Error ? e.message : "Failed to load recovery codes"
    return Response.json({ error: { message } }, { status: 500 })
  }
}
