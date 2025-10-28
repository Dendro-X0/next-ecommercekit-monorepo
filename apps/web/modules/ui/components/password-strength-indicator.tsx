"use client"

import { useMemo } from "react"

interface PasswordStrengthIndicatorProps {
  readonly password?: string
}

/**
 * Visual meter and inline requirements for password strength.
 */
export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  const strength = useMemo(() => {
    let score = 0
    if (!password) return 0
    if (password.length >= 8) score++
    if (/[a-z]/.test(password)) score++
    if (/[A-Z]/.test(password)) score++
    if (/[0-9]/.test(password)) score++
    if (/[^a-zA-Z0-9]/.test(password)) score++
    return score
  }, [password])

  const strengthLabel = useMemo(() => {
    switch (strength) {
      case 0:
      case 1:
        return "Weak"
      case 2:
        return "Fair"
      case 3:
        return "Good"
      case 4:
        return "Strong"
      case 5:
        return "Very Strong"
      default:
        return ""
    }
  }, [strength])

  const requirements = useMemo(() => {
    const value = password ?? ""
    const hasMin = value.length >= 8
    const hasNumber = /[0-9]/.test(value)
    const hasSpecial = /[^a-zA-Z0-9]/.test(value)
    return { hasMin, hasNumber, hasSpecial } as const
  }, [password])

  if (!password) return null

  return (
    <div className="mt-2 space-y-1">
      <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            strength <= 1
              ? "w-1/5 bg-red-500"
              : strength === 2
                ? "w-2/5 bg-orange-500"
                : strength === 3
                  ? "w-3/5 bg-yellow-500"
                  : strength === 4
                    ? "w-4/5 bg-green-400"
                    : "w-full bg-green-500"
          }`}
        />
      </div>
      <p className="text-xs text-muted-foreground">Password strength: {strengthLabel}</p>
      <div className="text-[11px] text-muted-foreground/90">
        <ul className="flex flex-wrap gap-x-3 gap-y-1">
          <li className={requirements.hasMin ? "text-green-600" : ""}>• 8+ chars</li>
          <li className={requirements.hasNumber ? "text-green-600" : ""}>• number</li>
          <li className={requirements.hasSpecial ? "text-green-600" : ""}>• special char</li>
        </ul>
      </div>
    </div>
  )
}
