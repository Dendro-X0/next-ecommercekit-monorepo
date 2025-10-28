/**
 * User domain types.
 *
 * This module defines the composite types used by user actions and UI.
 * It infers settings types from the existing zod schemas to ensure type safety.
 */
import type { z } from "zod"
import type { NotificationSettingsSchema, PrivacySettingsSchema } from "@/lib/validations/auth"

/**
 * Notification settings shape, inferred from zod schema.
 */
export type NotificationSettings = z.infer<typeof NotificationSettingsSchema>

/**
 * Privacy settings shape, inferred from zod schema.
 */
export type PrivacySettings = z.infer<typeof PrivacySettingsSchema>

/**
 * Public profile data used across the app.
 */
export type UserProfile = {
  readonly id: string
  readonly name: string
  readonly email: string
  readonly avatar: string
  readonly username: string
  readonly bio: string
  readonly location: string
  readonly website: string
  readonly createdAt: string
  readonly updatedAt: string
  readonly emailVerified: boolean
}

/**
 * User settings aggregate used by settings pages.
 */
export type UserSettings = {
  readonly hasPassword: boolean
  readonly twoFactorEnabled: boolean
  readonly backupCodes: string[]
  readonly trustedDevices: string[]
  readonly notifications: NotificationSettings
  readonly privacy: PrivacySettings
}
