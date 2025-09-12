import { NextResponse } from "next/server"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { createWriteStream } from "fs"
import { Readable } from "node:stream"
import { pipeline } from "node:stream/promises"
import type { ReadableStream as WebReadableStream } from "node:stream/web"
import path from "path"
import { mkdir } from "fs/promises"

export const runtime = "nodejs"

type Json = Readonly<Record<string, unknown>>

function badRequest(message: string): NextResponse<Json> {
  return NextResponse.json({ error: message }, { status: 400 })
}

function serverError(message: string): NextResponse<Json> {
  return NextResponse.json({ error: message }, { status: 500 })
}

function serviceUnavailable(message: string): NextResponse<Json> {
  return NextResponse.json({ error: message }, { status: 503 })
}

function envOrThrow(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`${name} is not set`)
  return v
}

function getS3Config(): Readonly<{
  region: string
  bucket: string
  accessKeyId: string
  secretAccessKey: string
  endpoint?: string
  publicBaseUrl?: string
  forcePathStyle?: boolean
}> | null {
  const region = process.env.S3_REGION || ""
  const bucket = process.env.S3_BUCKET || ""
  const accessKeyId = process.env.S3_ACCESS_KEY_ID || ""
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY || ""
  if (!region || !bucket || !accessKeyId || !secretAccessKey) return null
  return {
    region,
    bucket,
    accessKeyId,
    secretAccessKey,
    endpoint: process.env.S3_ENDPOINT || undefined,
    publicBaseUrl: process.env.S3_PUBLIC_BASE_URL || undefined,
    forcePathStyle: (process.env.S3_FORCE_PATH_STYLE || "false").toLowerCase() === "true",
  }
}

function publicUrl(cfg: NonNullable<ReturnType<typeof getS3Config>>, key: string): string {
  if (cfg.publicBaseUrl) return `${cfg.publicBaseUrl.replace(/\/$/, "")}/${key}`
  if (cfg.endpoint) {
    const base = cfg.forcePathStyle ? `${cfg.endpoint.replace(/\/$/, "")}/${cfg.bucket}` : cfg.endpoint.replace(/\/$/, "")
    return `${base}/${key}`
  }
  return `https://${cfg.bucket}.s3.${cfg.region}.amazonaws.com/${key}`
}

function inferExtFromType(type: string): string | null {
  if (!type) return null
  const map: Readonly<Record<string, string>> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/avif": "avif",
    "image/gif": "gif",
    "video/mp4": "mp4",
    "video/webm": "webm",
    "video/ogg": "ogv",
  }
  return map[type] || null
}

function generateKey(prefix: string, fileName?: string, contentType?: string): string {
  const now = new Date()
  const yyyy = String(now.getUTCFullYear())
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0")
  const uuid = (globalThis.crypto?.randomUUID?.() ?? `${now.getTime()}-${Math.random().toString(16).slice(2)}`)
  const safePrefix = prefix.replace(/[^a-zA-Z0-9!_\-\.\/*]/g, "-")
  const extFromName = fileName?.split(".").pop()
  const extFromType = inferExtFromType(contentType || "")
  const ext = (extFromType || extFromName || "bin").replace(/^\./, "")
  return `${safePrefix}/${yyyy}/${mm}/${uuid}.${ext}`
}

export async function POST(req: Request): Promise<NextResponse<Json>> {
  const cfg = getS3Config()
  const form: FormData = await req.formData()
  const file = form.get("file")
  if (!(file instanceof File)) return badRequest("Missing file")

  const MAX_UPLOAD_MB = Number(process.env.MAX_UPLOAD_MB || 25)
  if (file.size > MAX_UPLOAD_MB * 1024 * 1024) return badRequest(`File too large. Max ${MAX_UPLOAD_MB}MB`)

  const kind: "image" | "video" = (file.type || "").startsWith("video/") ? "video" : "image"

  // If S3 is configured, upload to S3; otherwise fall back to local disk in public/uploads
  if (cfg) {
    try {
      const arrayBuffer = await file.arrayBuffer()
      const body = new Uint8Array(arrayBuffer)
      const key = generateKey("uploads", file.name, file.type)
      const client = new S3Client({
        region: cfg.region,
        credentials: { accessKeyId: cfg.accessKeyId, secretAccessKey: cfg.secretAccessKey },
        endpoint: cfg.endpoint,
        forcePathStyle: cfg.forcePathStyle,
      })
      const cmd = new PutObjectCommand({ Bucket: cfg.bucket, Key: key, Body: body, ContentType: file.type || "application/octet-stream", ACL: "public-read" })
      await client.send(cmd)
      const url = publicUrl(cfg, key)
      return NextResponse.json({ url, kind } as const, { status: 200 })
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed"
      return serverError(message)
    }
  }

  try {
    const uploadsDir: string = path.join(process.cwd(), "public", "uploads")
    await mkdir(uploadsDir, { recursive: true })
    const safeBase: string = (file.name || "upload")
      .toLowerCase()
      .replace(/[^a-z0-9.]+/g, "-")
      .replace(/^-+|-+$/g, "")
    const timestamp: number = Date.now()
    const fileName: string = `${timestamp}-${safeBase}`
    const filePath: string = path.join(uploadsDir, fileName)
    const webStream: WebReadableStream<Uint8Array> = (
      file as unknown as { stream: () => WebReadableStream<Uint8Array> }
    ).stream()
    const nodeStream = Readable.fromWeb(webStream)
    const out = createWriteStream(filePath)
    await pipeline(nodeStream, out)
    const url: string = `/uploads/${fileName}`
    return NextResponse.json({ url, kind } as const, { status: 201 })
  } catch (e) {
    const message: string = e instanceof Error ? e.message : "Upload failed"
    return serverError(message)
  }
}


