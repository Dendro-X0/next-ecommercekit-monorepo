"use client"

import type React from "react"
import { useState } from "react"
import { authClient } from "@/lib/auth-client"

const MIN_PASSWORD_LENGTH: number = 8

type PasswordFormProps = { readonly hasPassword: boolean }

/**
 * Password change form for user security settings.
 * - Requires current password if the user already has one.
 * - Calls better-auth `changePassword` and optionally revokes other sessions.
 */
export function PasswordForm({ hasPassword }: PasswordFormProps): React.ReactElement {
  const [currentPassword, setCurrentPassword] = useState<string>("")
  const [newPassword, setNewPassword] = useState<string>("")
  const [confirmPassword, setConfirmPassword] = useState<string>("")
  const [revokeOtherSessions, setRevokeOtherSessions] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    setError(null)
    setSuccess(null)
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`)
      return
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }
    if (hasPassword && currentPassword.trim().length === 0) {
      setError("Current password is required.")
      return
    }
    try {
      await authClient.changePassword({
        newPassword,
        currentPassword: hasPassword ? currentPassword : newPassword,
        revokeOtherSessions,
      })
      setSuccess("Password changed successfully.")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (e) {
      const message: string = e instanceof Error ? e.message : "Failed to change password."
      setError(message)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {hasPassword && (
        <div className="flex flex-col gap-1">
          <label htmlFor="currentPassword" className="text-sm font-medium">
            Current password
          </label>
          <input
            id="currentPassword"
            name="currentPassword"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="border rounded px-3 py-2"
            autoComplete="current-password"
          />
        </div>
      )}
      <div className="flex flex-col gap-1">
        <label htmlFor="newPassword" className="text-sm font-medium">
          New password
        </label>
        <input
          id="newPassword"
          name="newPassword"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="border rounded px-3 py-2"
          autoComplete="new-password"
          minLength={MIN_PASSWORD_LENGTH}
          required
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="confirmPassword" className="text-sm font-medium">
          Confirm new password
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="border rounded px-3 py-2"
          autoComplete="new-password"
          minLength={MIN_PASSWORD_LENGTH}
          required
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          id="revokeOtherSessions"
          name="revokeOtherSessions"
          type="checkbox"
          checked={revokeOtherSessions}
          onChange={(e) => setRevokeOtherSessions(e.target.checked)}
          className="h-4 w-4"
        />
        <label htmlFor="revokeOtherSessions" className="text-sm">
          Sign out of other devices
        </label>
      </div>
      {error && <div className="text-sm text-red-600">{error}</div>}
      {success && <div className="text-sm text-green-600">{success}</div>}
      <button type="submit" className="px-4 py-2 rounded bg-primary text-white">
        Update password
      </button>
    </form>
  )
}
