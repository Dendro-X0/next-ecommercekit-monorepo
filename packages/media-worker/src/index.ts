import { spawn } from "node:child_process"
import { randomUUID } from "node:crypto"
import {
  and,
  db,
  eq,
  gt,
  mediaEvents as mediaEventsTable,
  media as mediaTable,
  sql,
} from "@repo/db"
import { cloudinaryStorage, s3Storage } from "@repo/storage"

/**
 * Media worker (stub):
 * - Polls for `transcode_queued` media_events
 * - Generates a preview URL (placeholder) and updates media.extra
 * - Emits `transcode_completed` event
 *
 * Replace the `generatePreviewUrl()` with real FFmpeg/transcoder integration.
 */

const POLL_MS: number = Number(process.env.MEDIA_WORKER_POLL_MS || 5000)
const WINDOW_MS: number = Number(process.env.MEDIA_WORKER_LOOKBACK_MS || 24 * 60 * 60 * 1000)
const PREVIEW_SECONDS: number = Number(process.env.MEDIA_PREVIEW_SECONDS || 6)
const FFMPEG_PATH: string = process.env.FFMPEG_PATH || "ffmpeg"
const STORAGE_PROVIDER: string = (process.env.STORAGE_PROVIDER || "").toLowerCase()

function transcodeWithFfmpeg(input: Uint8Array): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const args: string[] = [
      "-hide_banner",
      "-loglevel",
      "error",
      "-y",
      "-i",
      "pipe:0",
      "-t",
      String(PREVIEW_SECONDS),
      "-an",
      "-vf",
      "scale='min(480,iw)':-2",
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-movflags",
      "+faststart",
      "-f",
      "mp4",
      "pipe:1",
    ]
    const ff = spawn(FFMPEG_PATH, args, { stdio: ["pipe", "pipe", "pipe"] })
    const chunks: Uint8Array[] = []
    ff.stdout.on("data", (d: Buffer) => chunks.push(new Uint8Array(d)))
    let stderr = ""
    ff.stderr.on("data", (d: Buffer) => {
      stderr += d.toString()
    })
    ff.on("close", (code) => {
      if (code === 0) {
        const out = new Uint8Array(chunks.reduce((n, c) => n + c.length, 0))
        let offset = 0
        for (const c of chunks) {
          out.set(c, offset)
          offset += c.length
        }
        resolve(out)
      } else {
        reject(new Error(`ffmpeg failed (${code}): ${stderr}`))
      }
    })
    ff.stdin.end(Buffer.from(input))
  })
}

async function processQueue(): Promise<void> {
  const since = new Date(Date.now() - WINDOW_MS)
  // Find recently queued events
  const queued = await db
    .select({ id: mediaEventsTable.id, mediaId: mediaEventsTable.mediaId })
    .from(mediaEventsTable)
    .where(
      and(eq(mediaEventsTable.action, "transcode_queued"), gt(mediaEventsTable.createdAt, since)),
    )
    .limit(50)

  for (const ev of queued) {
    const mediaId: string | undefined = typeof ev.mediaId === "string" ? ev.mediaId : undefined
    if (!mediaId) continue
    // Fetch media
    const m = (
      await db
        .select({ id: mediaTable.id, url: mediaTable.url, extra: mediaTable.extra })
        .from(mediaTable)
        .where(eq(mediaTable.id, mediaId))
        .limit(1)
    )[0]
    if (!m) continue

    let previewUrl: string | undefined
    const srcUrl: string = m.url as unknown as string

    try {
      // If Cloudinary provider, prefer URL transformation instead of transcoding locally
      if (STORAGE_PROVIDER === "cloudinary" && /res\.cloudinary\.com\//.test(srcUrl)) {
        // Example: append a simple transformation for 6s clip and width 480
        // Cloudinary URLs can be transformed by inserting /c_scale,w_480,du_6/ after /upload/
        previewUrl = srcUrl.replace(
          /\/upload\/([^/]+)/,
          `/upload/c_scale,w_480,du_${String(PREVIEW_SECONDS)}/$1`,
        )
      } else {
        // Download, transcode with ffmpeg, and upload result to storage if configured
        const res = await fetch(srcUrl)
        const src = new Uint8Array(await res.arrayBuffer())
        const out = await transcodeWithFfmpeg(src)
        const key = `previews/${new Date().getUTCFullYear()}/${String(new Date().getUTCMonth() + 1).padStart(2, "0")}/${randomUUID()}.mp4`
        try {
          // Try S3 first
          const { url } = await s3Storage.upload({
            key,
            body: out,
            contentType: "video/mp4",
            acl: "public-read",
          })
          previewUrl = url
        } catch {
          // Fallback to Cloudinary if configured
          try {
            const { url } = await cloudinaryStorage.upload({
              folder: "previews",
              fileName: key.split("/").pop(),
              contentType: "video/mp4",
              body: out,
            })
            previewUrl = url
          } catch {
            // Last resort: embed data URL (not ideal)
            previewUrl = `data:video/mp4;base64,${Buffer.from(out).toString("base64")}`
          }
        }
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[media-worker] preview generation failed", err)
    }

    if (previewUrl) {
      // Merge previewUrl into extra jsonb
      await db
        .update(mediaTable)
        .set({
          // jsonb concatenation using Drizzle sql helper
          extra: sql`coalesce(${mediaTable.extra}, '{}'::jsonb) || ${JSON.stringify({ previewUrl })}::jsonb`,
        })
        .where(eq(mediaTable.id, mediaId))

      // Insert completion event
      await db
        .insert(mediaEventsTable)
        .values({ id: randomUUID(), mediaId, action: "transcode_completed" })
    } else {
      await db.insert(mediaEventsTable).values({
        id: randomUUID(),
        mediaId,
        action: "error",
        message: "Preview generation failed",
      })
    }
  }
}

async function main(): Promise<void> {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      await processQueue()
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[media-worker] error", err)
    }
    await new Promise((r) => setTimeout(r, POLL_MS))
  }
}

// Run if invoked directly
main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error("[media-worker] fatal", e)
  process.exit(1)
})
