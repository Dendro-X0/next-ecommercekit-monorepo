"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { authClient } from "@/lib/auth-client"
import { showToast } from "@/lib/utils/toast"

export function SocialLogin() {
  return (
    <div className="flex w-full flex-col items-center gap-y-2 my-4">
      <div className="relative w-full">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
        </div>
      </div>
      <div className="w-full grid grid-cols-2 gap-x-2">
        <Button
          size="lg"
          className="w-full"
          variant="outline"
          onClick={async () => {
            try {
              const callbackURL: string = (() => {
                try {
                  const origin = window.location.origin
                  return new URL("/dashboard", origin).toString()
                } catch {
                  return "/dashboard"
                }
              })()
              await authClient.signIn.social({ provider: "google", callbackURL })
            } catch (e) {
              const message: string = e instanceof Error ? e.message : "Google sign-in failed"
              showToast(message, { type: "error" })
            }
          }}
        >
          <Image
            src="/icons/google.svg"
            alt=""
            width={20}
            height={20}
            className="mr-2"
            priority={false}
          />
          Google
        </Button>
        <Button
          size="lg"
          className="w-full"
          variant="outline"
          onClick={async () => {
            try {
              const callbackURL: string = (() => {
                try {
                  const origin = window.location.origin
                  return new URL("/dashboard", origin).toString()
                } catch {
                  return "/dashboard"
                }
              })()
              await authClient.signIn.social({ provider: "github", callbackURL })
            } catch (e) {
              const message: string = e instanceof Error ? e.message : "GitHub sign-in failed"
              showToast(message, { type: "error" })
            }
          }}
        >
          <Image
            src="/icons/github.svg"
            alt=""
            width={20}
            height={20}
            className="mr-2"
            priority={false}
          />
          GitHub
        </Button>
      </div>
    </div>
  )
}
