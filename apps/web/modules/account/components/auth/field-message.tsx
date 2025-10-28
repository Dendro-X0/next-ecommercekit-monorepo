"use client"

import { cn } from "@/lib/utils/index"

interface FieldMessageProps {
  messages?: string | string[]
  className?: string
}

export function FieldMessage({ messages, className }: FieldMessageProps) {
  if (!messages) {
    return null
  }

  const messageArray: readonly string[] = Array.isArray(messages) ? messages : [messages]

  if (messageArray.length === 0) {
    return null
  }

  return (
    <div className={cn("text-sm font-medium text-destructive", className)}>
      {[...new Set(messageArray)].map((message: string) => (
        <p key={message}>{message}</p>
      ))}
    </div>
  )
}
