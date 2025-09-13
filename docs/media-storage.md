# Media Storage Integration

S3- and Cloudinary-backed storage are implemented for product/category media. Admin uploads
persist real image/video URLs using a Next.js Route Handler at `/api/uploads`.

- With `STORAGE_PROVIDER=s3` and S3 envs present, the route stores in S3 and returns public URLs.
- With `STORAGE_PROVIDER=cloudinary` and Cloudinary envs present, the route uploads to Cloudinary.
- When neither is configured, the route falls back to saving in `public/uploads/` for local dev.

## Goals

- Reliable, fast, and secure uploads for images and videos.
- Direct‑to‑storage uploads from the browser using short‑lived signed URLs.
- Store media metadata in DB and associate with products/categories.
- Efficient delivery via CDN/Next Image with transformations when possible.
- Clear local dev story (no cloud dependency for iteration).

## User Stories

- As an admin, I can upload a product image or video and see it persist without placeholders.
- As an admin, I can set a primary image, remove gallery items, and re‑order media.
- As a customer, I always see real media for products and category tiles.

## Providers

- S3 compatible (Amazon S3, Cloudflare R2, MinIO)
- Cloudinary (image/video CDN and transformations)

The project ships with S3 and Cloudinary adapters under `@repo/storage`.

## Quickstart: Media

Set one provider and start uploading via `POST /api/uploads`. In development, if neither provider is configured, uploads fall back to `public/uploads/`.

### S3 (recommended baseline)

```bash
STORAGE_PROVIDER=s3
S3_REGION=us-east-1
S3_BUCKET=your-bucket
S3_ACCESS_KEY_ID=XXXX
S3_SECRET_ACCESS_KEY=YYYY
# Optional for S3‑compatible services
S3_ENDPOINT=https://<r2-or-minio-endpoint>
S3_PUBLIC_BASE_URL=https://cdn.example.com
S3_FORCE_PATH_STYLE=false
# Limits & quotas
MAX_UPLOAD_MB=25
MEDIA_DAILY_LIMIT=200
```

### Cloudinary

```bash
STORAGE_PROVIDER=cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud
CLOUDINARY_API_KEY=XXXX
CLOUDINARY_API_SECRET=YYYY
# Optional (used by custom loaders/CDN routing)
CLOUDINARY_PUBLIC_BASE_URL=https://res.cloudinary.com/your-cloud
# Limits & quotas
MAX_UPLOAD_MB=25
MEDIA_DAILY_LIMIT=200
```

### Worker (Video Previews)

```bash
# FFmpeg binary (system PATH or explicit)
FFMPEG_PATH=ffmpeg
MEDIA_PREVIEW_SECONDS=6
MEDIA_WORKER_POLL_MS=5000
MEDIA_WORKER_LOOKBACK_MS=86400000
```

Run the worker locally:

```bash
pnpm -C packages/media-worker build
pnpm -C packages/media-worker start
```

## Architecture (Current)

- Direct upload through the server via `POST /api/uploads`.
- Provider routing in the handler: S3 via `s3Storage`, Cloudinary via `cloudinaryStorage`; fallback to local disk.
- Media metadata table in DB (`media`), audit trail (`media_events`).
- Relations: `product_media` (productId, mediaId, position)
- Video preview worker (`packages/media-worker`):
  - Emits `transcode_queued` on video upload.
  - Worker consumes queued events and generates a short preview (default 6s). For Cloudinary URLs, a URL transformation is used; otherwise, FFmpeg is used to transcode, then preview is uploaded to S3 or Cloudinary.
  - On success, sets `media.extra.previewUrl` and emits `transcode_completed`.

## Security & Validation

- Role‑gated signing endpoints (admins only).
- Validate content type, extension, and size; optional lightweight antivirus hook.
- Limit gallery size and file count per request; enforce quotas.
- Generate unique object keys (`{env}/{yyyymm}/{uuid}.{ext}`) to avoid conflicts.

## Client Integration (Admin)

- `apps/web/src/app/dashboard/admin/_components/media-uploader.tsx` posts directly to `/api/uploads`.
- On success, the route returns `{ url, kind }` and the product form receives and displays real previews immediately.
- Product form allows selecting a primary image from the uploaded gallery.

## Delivery & Optimization

- Prefer Next.js Image component with a custom loader backed by the CDN/public URL (see `apps/web/src/lib/image-loader.ts`).
- For S3, use `S3_PUBLIC_BASE_URL` and width/quality query params where CDN supports them.
- For Cloudinary, remote patterns are whitelisted and URLs can include transformation segments.
- For video, store original and a low‑bitrate preview; lazy‑load with `preload="metadata"`.

## Local Development

- Default to a local S3 emulator (e.g., MinIO or LocalStack) with `.env` overrides.
- The local fallback avoids cloud setup: files are written to `apps/web/public/uploads/`.

## Environment Variables

```
# Provider selection
STORAGE_PROVIDER=s3 # or cloudinary

# S3 (if using S3)
S3_REGION=
S3_BUCKET=
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
# Optional for S3-compatible services (e.g., R2/MinIO)
S3_ENDPOINT=
S3_PUBLIC_BASE_URL=
S3_FORCE_PATH_STYLE=false

# Cloudinary (if using Cloudinary)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_PUBLIC_BASE_URL=

# Upload limits & quotas
MAX_UPLOAD_MB=25
MEDIA_DAILY_LIMIT=200

# Worker (video previews)
FFMPEG_PATH=ffmpeg
MEDIA_PREVIEW_SECONDS=6
MEDIA_WORKER_POLL_MS=5000
MEDIA_WORKER_LOOKBACK_MS=86400000
```

## Migration Plan

- Script to scan products/categories with placeholder URLs and backfill to media records.
- Optionally copy placeholder files to storage and update references in DB.

## Acceptance Criteria

- Admin can upload image/video; the gallery shows persisted media immediately.
- Product primary image can be set from uploaded media; PDP renders that asset.
- Placeholders are no longer used after save; a real public URL is stored.
- Uploads are access‑controlled and size/type‑validated; large files show progress.

## Follow-ups

1) Optional: presigned URL flow (browser direct-to-storage) and antivirus hook
2) Expand Cloudinary transformations and presets; configurable preview bitrate/codec
3) Media DB schema (URL, kind, dimensions, bytes, alt) and relations to products/categories
4) Quotas/limits and admin audit log entries

## References

- Next.js Route Handlers
- AWS S3 Signed URLs, Multipart Upload
- Drizzle ORM relations
