"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { AuthState, LoginCredentials, SignUpData, User } from "@/lib/types/auth"

interface AuthStore extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>
  signup: (data: SignUpData) => Promise<void>
  logout: () => void
  updateUser: (userData: Partial<User>) => void
  clearError: () => void
  setLoading: (loading: boolean) => void
}

// Mock user data
const mockUser: User = {
  id: "1",
  firstName: "John",
  lastName: "Doe",
  email: "john.doe@example.com",
  phone: "+1 (555) 123-4567",
  avatar: "/placeholder.svg?height=100&width=100",
  emailVerified: true,
  twoFactorEnabled: false,
  createdAt: "2024-01-15T00:00:00Z",
  updatedAt: "2024-01-20T00:00:00Z",
  preferences: {
    newsletter: true,
    notifications: true,
    theme: "system",
    language: "en",
  },
  addresses: [
    {
      id: "1",
      type: "shipping",
      firstName: "John",
      lastName: "Doe",
      address: "123 Main St",
      city: "New York",
      state: "NY",
      zipCode: "10001",
      country: "United States",
      isDefault: true,
    },
  ],
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true, error: null })

        try {
          // Simulate API call
          await new Promise((resolve) => setTimeout(resolve, 1000))

          // Mock validation
          if (credentials.email === "john.doe@example.com" && credentials.password === "password") {
            set({ user: mockUser, isAuthenticated: true, isLoading: false })
          } else {
            throw new Error("Invalid email or password")
          }
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false })
          throw error
        }
      },

      signup: async (data: SignUpData) => {
        set({ isLoading: true, error: null })

        try {
          // Simulate API call
          await new Promise((resolve) => setTimeout(resolve, 1000))

          const newUser: User = {
            ...mockUser,
            id: Date.now().toString(),
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            emailVerified: false,
          }

          set({ user: newUser, isAuthenticated: true, isLoading: false })
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false })
          throw error
        }
      },

      logout: () => {
        set({ user: null, isAuthenticated: false, error: null })
      },

      updateUser: (userData: Partial<User>) => {
        const currentUser = get().user
        if (currentUser) {
          set({ user: { ...currentUser, ...userData } })
        }
      },

      clearError: () => {
        set({ error: null })
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading })
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
)
