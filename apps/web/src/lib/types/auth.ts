export interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  avatar?: string
  emailVerified: boolean
  twoFactorEnabled: boolean
  createdAt: string
  updatedAt: string
  preferences: {
    newsletter: boolean
    notifications: boolean
    theme: "light" | "dark" | "system"
    language: string
  }
  addresses: Address[]
}

export interface Address {
  id: string
  type: "shipping" | "billing"
  firstName: string
  lastName: string
  company?: string
  address: string
  city: string
  state: string
  zipCode: string
  country: string
  isDefault: boolean
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

export interface LoginCredentials {
  email: string
  password: string
  rememberMe?: boolean
}

export interface SignUpData {
  firstName: string
  lastName: string
  email: string
  password: string
  confirmPassword: string
  acceptTerms: boolean
}

export interface ResetPasswordData {
  email: string
}

export interface NewPasswordData {
  token: string
  password: string
  confirmPassword: string
}

export interface TwoFactorData {
  code: string
  trustDevice?: boolean
}

export interface ContactFormData {
  name: string
  email: string
  subject: string
  message: string
  phone?: string
}
