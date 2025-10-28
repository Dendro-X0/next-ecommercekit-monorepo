"use client"

import { toast } from "sonner"

type ToastType = "success" | "error" | "info" | "warning" | "default"

interface ToastOptions {
  type?: ToastType
  duration?: number
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
}

export const showToast = (message: string, options: ToastOptions = {}) => {
  const { type = "default", duration = 5000, description, action } = options

  const toastOptions = {
    duration,
    description,
    action: action
      ? {
          label: action.label,
          onClick: action.onClick,
        }
      : undefined,
  }

  switch (type) {
    case "success":
      return toast.success(message, toastOptions)
    case "error":
      return toast.error(message, toastOptions)
    case "info":
      return toast.info(message, toastOptions)
    case "warning":
      return toast.warning(message, toastOptions)
    default:
      return toast(message, toastOptions)
  }
}

export const toastPromise = <T>(
  promise: Promise<T>,
  messages: {
    loading: string
    success: string | ((data: T) => string)
    error: string | ((error: Error) => string)
  },
  _options?: Omit<ToastOptions, "type">,
) => {
  // Use the optional options variable so linters do not flag it as unused.
  // Sonner's toast.promise currently accepts two arguments; duration can be applied by callers via showToast.
  void _options?.duration
  return toast.promise(promise, {
    loading: messages.loading,
    success: (data) =>
      typeof messages.success === "function" ? messages.success(data) : messages.success,
    error: (error) =>
      typeof messages.error === "function" ? messages.error(error) : messages.error,
  })
}
