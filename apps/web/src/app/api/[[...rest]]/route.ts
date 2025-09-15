import { app } from "@repo/api"
import { handle } from "hono/vercel"

export const runtime = "nodejs"

type NextHandler = (req: Request) => Promise<Response>
const anyHandle = handle as unknown as (h: unknown) => NextHandler
const handler: NextHandler = anyHandle(app as unknown)

export const GET = handler
export const POST = handler
export const PATCH = handler
export const PUT = handler
export const DELETE = handler
export const OPTIONS = handler
export const HEAD = handler
