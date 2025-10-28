"use client"

import { useTheme } from "next-themes"
import React from "react"
import { Laptop, Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function ThemeToggle(): React.ReactElement {
  const [mounted, setMounted] = React.useState(false)
  const { setTheme, theme } = useTheme()

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    // Reserve final control footprint to prevent CLS during hydration
    // Compact width on mobile (Sun + Moon only), full width on ≥sm (adds System)
    return <div className="h-10 w-[76px] sm:w-[108px] border rounded-full p-1" aria-hidden="true" />
  }

  const themes = [
    { name: "light", icon: Sun },
    { name: "system", icon: Laptop },
    { name: "dark", icon: Moon },
  ]

  return (
    // Keep fixed width/height to avoid layout shifts as icons or fonts load
    <div className="border rounded-full p-1 flex items-center gap-1 h-10 w-[76px] sm:w-[108px]">
      {themes.map((t) => (
        <Button
          key={t.name}
          variant="ghost"
          size="icon"
          className={cn(
            "rounded-full h-8 w-8",
            // Hide the System option on small screens to shorten the control
            t.name === "system" && "hidden sm:inline-flex",
            theme === t.name && "bg-accent text-accent-foreground",
          )}
          onClick={() => setTheme(t.name)}
          aria-label={`Switch to ${t.name} mode`}
        >
          <t.icon className="h-4 w-4" />
        </Button>
      ))}
    </div>
  )
}
