/**
 * S3 storage implementation.
 * One export per file: `s3Storage`.
 */
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3"

export type S3StorageConfig = Readonly<{
  region: string
  bucket: string
  accessKeyId: string
  secretAccessKey: string
  endpoint?: string
  publicBaseUrl?: string
  forcePathStyle?: boolean
}>

export type UploadParams = Readonly<{
  key: string
  contentType: string
  body: Uint8Array
  acl?: "private" | "public-read"
}>

export type UploadResult = Readonly<{
  key: string
  url: string
}>

function readConfigFromEnv(): S3StorageConfig {
  const region = process.env.S3_REGION || ""
  const bucket = process.env.S3_BUCKET || ""
  const accessKeyId = process.env.S3_ACCESS_KEY_ID || ""
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY || ""
  const endpoint = process.env.S3_ENDPOINT || undefined
  const publicBaseUrl = process.env.S3_PUBLIC_BASE_URL || undefined
  const forcePathStyle: boolean =
    (process.env.S3_FORCE_PATH_STYLE || "false").toLowerCase() === "true"
  return { region, bucket, accessKeyId, secretAccessKey, endpoint, publicBaseUrl, forcePathStyle }
}

function ensureConfigValid(cfg: S3StorageConfig): void {
  if (!cfg.region || !cfg.bucket || !cfg.accessKeyId || !cfg.secretAccessKey) {
    throw new Error(
      "S3 storage is not configured. Please set S3_REGION, S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY.",
    )
  }
}

function createClient(cfg: S3StorageConfig): S3Client {
  const creds = { accessKeyId: cfg.accessKeyId, secretAccessKey: cfg.secretAccessKey }
  const client = new S3Client({
    region: cfg.region,
    credentials: creds,
    endpoint: cfg.endpoint,
    forcePathStyle: cfg.forcePathStyle,
  })
  return client
}

function buildPublicUrl(cfg: S3StorageConfig, key: string): string {
  if (cfg.publicBaseUrl) {
    return `${cfg.publicBaseUrl.replace(/\/$/, "")}/${key}`
  }
  if (cfg.endpoint) {
    const base = cfg.forcePathStyle
      ? `${cfg.endpoint.replace(/\/$/, "")}/${cfg.bucket}`
      : cfg.endpoint.replace(/\/$/, "")
    return `${base}/${key}`
  }
  return `https://${cfg.bucket}.s3.${cfg.region}.amazonaws.com/${key}`
}

function sanitizeKeySegment(seg: string): string {
  return seg.replace(/[^a-zA-Z0-9!_\-./*]/g, "-")
}

/**
 * `s3Storage`: minimal upload and URL builder.
 */
export const s3Storage = {
  /** Reads config from env and validates it. */
  config(): S3StorageConfig {
    const cfg = readConfigFromEnv()
    ensureConfigValid(cfg)
    return cfg
  },

  /** Uploads a buffer to S3 and returns the public URL. */
  async upload(params: UploadParams): Promise<UploadResult> {
    const cfg = s3Storage.config()
    const client = createClient(cfg)
    const cmd = new PutObjectCommand({
      Bucket: cfg.bucket,
      Key: params.key,
      Body: params.body,
      ContentType: params.contentType,
      ACL: params.acl ?? "public-read",
    })
    await client.send(cmd)
    return { key: params.key, url: buildPublicUrl(cfg, params.key) }
  },

  /** Returns a public URL for a given key. */
  publicUrl(key: string): string {
    const cfg = s3Storage.config()
    return buildPublicUrl(cfg, key)
  },

  /** Generates a safe object key using a yyyy/mm/uuid pattern. */
  generateKey(opts: Readonly<{ prefix?: string; fileName?: string; ext?: string }>): string {
    const now = new Date()
    const yyyy = String(now.getUTCFullYear())
    const mm = String(now.getUTCMonth() + 1).padStart(2, "0")
    const uuid =
      globalThis.crypto?.randomUUID?.() ?? `${now.getTime()}-${Math.random().toString(16).slice(2)}`
    const baseName = opts.fileName ? opts.fileName.replace(/\s+/g, "-") : "file"
    const ext = opts.ext?.replace(/^\./, "") || baseName.split(".").pop() || "bin"
    const prefix = opts.prefix ? sanitizeKeySegment(opts.prefix) : "uploads"
    return `${prefix}/${yyyy}/${mm}/${uuid}.${ext}`
  },
}
