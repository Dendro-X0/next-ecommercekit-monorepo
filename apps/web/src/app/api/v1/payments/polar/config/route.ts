import { NextResponse } from "next/server"

export async function GET(): Promise<Response> {
  const configured: boolean = Boolean(process.env.POLAR_ACCESS_TOKEN)
  const raw: string = process.env.POLAR_SERVER ?? "sandbox"
  const server: "sandbox" | "production" = raw === "production" ? "production" : "sandbox"
  return NextResponse.json({ configured, server })
}
