# Media Storage Integration

S3-backed storage is implemented for product/category media. Admin uploads now persist
real image/video URLs using a Next.js Route Handler at `/api/uploads`. When S3 is not
configured, the route falls back to saving in `public/uploads/` for local dev.

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
- Supabase Storage (Postgres‑backed with signed URLs; good DX)
- UploadThing (DX‑focused wrapper for Next; simple setup)

The project ships with an S3‑compatible baseline for portability. We can later add
other providers (e.g., Supabase Storage or UploadThing) via a storage adapter.

## Architecture (Current)

- Direct upload through the server via `POST /api/uploads`.
- If S3 envs are present, the server stores objects in S3 with `public-read` and returns a public URL.
- If S3 envs are missing (dev), files are streamed to `public/uploads/` and served statically.
- Media metadata table in DB (Drizzle, Postgres) e.g. `media`:
  - `id`, `kind` (image|video), `provider` (s3|r2|supabase|uploadthing), `bucket`, `key`, `url`,
    `bytes`, `width`, `height`, `contentType`, `checksum`, `createdAt`, `createdBy`.
- Relations:
  - `product_media` (productId, mediaId, position)
  - `category_media` (categoryId, mediaId, position)

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

- Prefer Next.js Image component with a loader backed by the CDN public URL.
- For providers that support on‑the‑fly transforms, leverage width/quality params.
- For video, store original and optional low‑bitrate preview; lazy‑load with `preload="metadata"`.

## Local Development

- Default to a local S3 emulator (e.g., MinIO or LocalStack) with `.env` overrides.
- The local fallback avoids cloud setup: files are written to `apps/web/public/uploads/`.

## Environment Variables

```
# S3 (required for cloud uploads; if omitted, route falls back to local disk)
S3_REGION=
S3_BUCKET=
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
# Optional for S3-compatible services (e.g., R2/MinIO)
S3_ENDPOINT=
S3_PUBLIC_BASE_URL=
S3_FORCE_PATH_STYLE=false
# Upload limits
MAX_UPLOAD_MB=25
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
2) Image derivatives via CDN/loader and video preview transcoding
3) Media DB schema (URL, kind, dimensions, bytes, alt) and relations to products/categories
4) Quotas/limits and admin audit log entries

## References

- Next.js Route Handlers
- AWS S3 Signed URLs, Multipart Upload
- Drizzle ORM relations
