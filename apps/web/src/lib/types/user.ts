// User data types and utilities
export interface UserProfile {
  id: string
  username: string
  email: string
  name?: string
  bio?: string
  avatar?: string
  location?: string
  website?: string
  createdAt: string
  updatedAt: string
  emailVerified: boolean
}

export interface UserSettings {
  hasPassword?: boolean
  twoFactorEnabled: boolean
  backupCodes?: string[]
  trustedDevices: TrustedDevice[]
  notifications: NotificationSettings
  privacy: PrivacySettings
}

export interface TrustedDevice {
  id: string
  name: string
  lastUsed: string
  userAgent: string
}

export interface NotificationSettings {
  email: {
    security: boolean
    marketing: boolean
    updates: boolean
  }
  push: {
    security: boolean
    mentions: boolean
    updates: boolean
  }
}

export interface PrivacySettings {
  profileVisibility: "public" | "private"
  showEmail: boolean
  showLocation: boolean
}

export interface PasswordChangeData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}
