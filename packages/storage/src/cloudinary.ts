import { v2 as cloudinary, type UploadApiErrorResponse, type UploadApiResponse } from "cloudinary"

export type CloudinaryConfig = Readonly<{
  cloudName: string
  apiKey: string
  apiSecret: string
  publicBaseUrl?: string
}>

export type CloudinaryUploadParams = Readonly<{
  folder?: string
  fileName?: string
  contentType?: string
  body: Uint8Array
}>

export type CloudinaryUploadResult = Readonly<{
  publicId: string
  url: string
}>

function readConfigFromEnv(): CloudinaryConfig {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || ""
  const apiKey = process.env.CLOUDINARY_API_KEY || ""
  const apiSecret = process.env.CLOUDINARY_API_SECRET || ""
  const publicBaseUrl = process.env.CLOUDINARY_PUBLIC_BASE_URL || undefined
  return { cloudName, apiKey, apiSecret, publicBaseUrl }
}

function ensureValid(cfg: CloudinaryConfig): void {
  if (!cfg.cloudName || !cfg.apiKey || !cfg.apiSecret) {
    throw new Error(
      "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET",
    )
  }
}

function configure(cloudName: string, apiKey: string, apiSecret: string): void {
  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret })
}

export const cloudinaryStorage = {
  config(): CloudinaryConfig {
    const cfg = readConfigFromEnv()
    ensureValid(cfg)
    configure(cfg.cloudName, cfg.apiKey, cfg.apiSecret)
    return cfg
  },
  async upload(params: CloudinaryUploadParams): Promise<CloudinaryUploadResult> {
    const _cfg = cloudinaryStorage.config()
    const folder = params.folder || "uploads"
    const resourceType = (params.contentType || "").startsWith("video/") ? "video" : "image"
    return await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: resourceType,
          public_id: params.fileName?.replace(/\.[^.]+$/, ""),
        },
        (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
          if (error || !result) return reject(error || new Error("Cloudinary upload failed"))
          const secureUrl: string = (result.secure_url as string) || (result.url as string)
          resolve({ publicId: result.public_id as string, url: secureUrl })
        },
      )
      stream.end(Buffer.from(params.body))
    })
  },
}
