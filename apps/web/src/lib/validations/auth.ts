import { z } from "zod"

export const ProfileSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters long."),
  username: z.string().min(3, "Username must be at least 3 characters long."),
  bio: z.string().max(160, "Bio must be less than 160 characters").optional(),
  location: z.string().optional(),
  website: z.string().url("Invalid URL").optional().or(z.literal("")),
})

export const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters long"),
    confirmPassword: z.string(),
  })
  .refine(
    (data: { newPassword: string; confirmPassword: string }) =>
      data.newPassword === data.confirmPassword,
    {
      message: "New passwords do not match",
      path: ["confirmPassword"],
    },
  )

export const setPasswordSchema = z
  .object({
    newPassword: z.string().min(8, "Password must be at least 8 characters long"),
    confirmPassword: z.string(),
  })
  .refine(
    (data: { newPassword: string; confirmPassword: string }) =>
      data.newPassword === data.confirmPassword,
    {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    },
  )

export const NotificationSettingsSchema = z.object({
  email: z.object({
    security: z.coerce.boolean().default(false),
    marketing: z.coerce.boolean().default(false),
    updates: z.coerce.boolean().default(false),
  }),
  push: z.object({
    security: z.coerce.boolean().default(false),
    mentions: z.coerce.boolean().default(false),
    updates: z.coerce.boolean().default(false),
  }),
})

export const PrivacySettingsSchema = z.object({
  profileVisibility: z.enum(["public", "private"]).default("public"),
  showEmail: z.coerce.boolean().default(false),
  showLocation: z.coerce.boolean().default(true),
})
