"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Camera, CheckCircle2, XCircle } from "lucide-react"
import { type ReactElement, useActionState, useEffect, useId, useRef, useState } from "react"
import { type SubmitHandler, useForm } from "react-hook-form"
import { z } from "zod"
import { uploadAvatarAction } from "@/actions/user/upload-avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authClient } from "@/lib/auth-client"
import { authClientHelpers } from "@/lib/auth-client-helpers"

type SessionUser = {
  id: string
  email: string
  name: string | null
  username?: string | null
  image?: string | null
  roles?: readonly string[]
  emailVerified?: boolean
}
const usernamePattern = /^[a-zA-Z0-9._-]{3,30}$/
const ProfileSchema = z.object({
  name: z.string().min(2),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(usernamePattern, "Use letters, numbers, dot, underscore or hyphen"),
})
type ProfileValues = z.infer<typeof ProfileSchema>

type AnyRecord = Record<string, unknown>
const getRoles = (u: AnyRecord): readonly string[] | undefined => {
  const v = u.roles
  return Array.isArray(v) && v.every((x) => typeof x === "string")
    ? (v as readonly string[])
    : undefined
}

/**
 * ProfileSettingsPage shows and updates authenticated user profile using Better Auth client.
 */
export default function ProfileSettingsPage(): ReactElement {
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null)
  const [message, setMessage] = useState<string | undefined>(undefined)
  const [error, setError] = useState<string | undefined>(undefined)
  const [avatarState, avatarFormAction] = useActionState(uploadAvatarAction, null)
  const [verifyMsg, setVerifyMsg] = useState<string | undefined>(undefined)
  const [verifyErr, setVerifyErr] = useState<string | undefined>(undefined)
  const [verifyLoading, setVerifyLoading] = useState<boolean>(false)
  const avatarInputId = useId()
  const emailInputId = useId()
  const form = useForm<ProfileValues>({
    resolver: zodResolver(ProfileSchema),
    defaultValues: { name: "", username: "" },
  })
  useEffect(() => {
    let mounted = true
    authClient.getSession().then(({ data }) => {
      if (!mounted) return
      const u = data?.user as AnyRecord | undefined
      if (u) {
        setSessionUser({
          id: String(u.id ?? ""),
          email: String(u.email ?? ""),
          name: typeof u.name === "string" ? (u.name as string) : null,
          username: typeof u.username === "string" ? (u.username as string) : null,
          image: (typeof u.image === "string" ? (u.image as string) : undefined) ?? null,
          roles: getRoles(u),
          emailVerified:
            typeof u.emailVerified === "boolean" ? (u.emailVerified as boolean) : undefined,
        })
        form.reset({
          name: typeof u.name === "string" ? (u.name as string) : "",
          username: typeof u.username === "string" ? (u.username as string) : "",
        })
      }
    })
    return () => {
      mounted = false
    }
  }, [form])
  const onUpdateName: SubmitHandler<ProfileValues> = async (values): Promise<void> => {
    setMessage(undefined)
    setError(undefined)
    const { error: e } = await authClientHelpers.updateUserProfile({
      name: values.name,
      username: values.username,
    })
    if (e) setError(e.message)
    else {
      setMessage("Profile updated.")
      setSessionUser((prev) =>
        prev ? { ...prev, name: values.name, username: values.username } : prev,
      )
    }
  }
  const onResendVerify = async (): Promise<void> => {
    setVerifyMsg(undefined)
    setVerifyErr(undefined)
    if (!sessionUser?.email) {
      setVerifyErr("No email found.")
      return
    }
    setVerifyLoading(true)
    const { error: e } = await authClient.sendVerificationEmail({
      email: sessionUser.email,
      callbackURL: "/dashboard",
    })
    setVerifyLoading(false)
    if (e) setVerifyErr(e.message)
    else setVerifyMsg("Verification email sent.")
  }
  const onSignOut = async (): Promise<void> => {
    await authClient.signOut()
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>View and update your profile information</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {message && (
          <Alert>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="flex flex-col items-center gap-3 text-center">
          {/* Clickable avatar upload */}
          <form
            action={avatarFormAction}
            className="flex flex-col items-center"
            ref={useRef<HTMLFormElement>(null)}
            onChange={(e) => {
              const target = e.target as HTMLInputElement
              if (target && target.type === "file") {
                ;(e.currentTarget as HTMLFormElement).requestSubmit()
              }
            }}
          >
            <input
              id={avatarInputId}
              name="avatar"
              type="file"
              accept="image/*"
              className="sr-only"
            />
            <label
              htmlFor={avatarInputId}
              className="relative h-32 w-32 rounded-full ring-1 ring-border overflow-hidden cursor-pointer group"
            >
              <Avatar className="h-32 w-32">
                <AvatarImage src={sessionUser?.image || "/placeholder.svg"} />
                <AvatarFallback className="text-lg">
                  {(sessionUser?.name || sessionUser?.email || "U").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="absolute inset-0 hidden group-hover:flex items-center justify-center bg-black/50 text-white">
                <Camera className="h-5 w-5 mr-2" /> Upload
              </span>
            </label>
            <p className="text-xs text-muted-foreground mt-1">
              Click the avatar to upload. JPG, PNG or GIF. Max size 5MB.
            </p>
          </form>
          {avatarState?.message && (
            <p className="text-sm text-muted-foreground">{avatarState.message}</p>
          )}
          {avatarState?.error?.form && (
            <p className="text-sm text-destructive">{avatarState.error.form}</p>
          )}
        </div>
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onUpdateName)}>
            <div className="grid gap-4 md:grid-cols-2">
              {/* Left column: Email and Email Verification */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor={emailInputId}>Email</Label>
                  <Input id={emailInputId} type="email" value={sessionUser?.email ?? ""} readOnly />
                </div>
                <div className="space-y-2">
                  <Label>Email Verification</Label>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm">
                      {sessionUser?.emailVerified ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span>Verified</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 text-amber-500" />
                          <span>Not verified</span>
                        </>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={onResendVerify}
                      disabled={
                        !sessionUser || sessionUser?.emailVerified === true || verifyLoading
                      }
                      loading={verifyLoading}
                    >
                      Resend
                    </Button>
                  </div>
                  {verifyMsg && <p className="text-sm text-muted-foreground">{verifyMsg}</p>}
                  {!sessionUser && (
                    <p className="text-sm text-muted-foreground">
                      Sign in to resend verification email.
                    </p>
                  )}
                  {verifyErr && <p className="text-sm text-destructive">{verifyErr}</p>}
                </div>
              </div>

              {/* Right column: Display name */}
              <div className="space-y-2">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="yourname" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display name</FormLabel>
                      <FormControl>
                        <Input placeholder="Your name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit">Save</Button>
              <Button type="button" variant="secondary" onClick={onSignOut}>
                Sign out
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
