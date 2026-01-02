"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import type { ReactElement } from "react"
import { type SubmitHandler, useForm } from "react-hook-form"
import { z } from "zod"
import { Alert, AlertDescription } from "@/components/ui/alert"
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
import { authClient } from "@/lib/auth-client"
import { authClientHelpers } from "@/lib/auth-client-helpers"

const PasswordSchema = z.object({ password: z.string().min(8) })
type PasswordValues = z.infer<typeof PasswordSchema>
const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z.string().min(8),
})
type ChangePasswordValues = z.infer<typeof ChangePasswordSchema>
const ChangeEmailSchema = z.object({ newEmail: z.string().email() })
type ChangeEmailValues = z.infer<typeof ChangeEmailSchema>

/**
 * SecuritySettingsPage manages password, email, and 2FA with Better Auth client.
 */
export default function SecuritySettingsPage(): ReactElement {
  const pwForm = useForm<ChangePasswordValues>({
    resolver: zodResolver(ChangePasswordSchema as never),
    defaultValues: { currentPassword: "", newPassword: "" },
  })
  const emailForm = useForm<ChangeEmailValues>({
    resolver: zodResolver(ChangeEmailSchema as never),
    defaultValues: { newEmail: "" },
  })
  const confForm = useForm<PasswordValues>({
    resolver: zodResolver(PasswordSchema as never),
    defaultValues: { password: "" },
  })
  const onChangePassword: SubmitHandler<ChangePasswordValues> = async (values): Promise<void> => {
    await authClient.changePassword({
      currentPassword: values.currentPassword,
      newPassword: values.newPassword,
      revokeOtherSessions: true,
    })
  }
  const onChangeEmail: SubmitHandler<ChangeEmailValues> = async (values): Promise<void> => {
    await authClient.changeEmail({ newEmail: values.newEmail })
  }
  const onEnable2FA: SubmitHandler<PasswordValues> = async (values): Promise<void> => {
    await authClientHelpers.twoFactorEnable({ password: values.password })
  }
  const onDisable2FA: SubmitHandler<PasswordValues> = async (values): Promise<void> => {
    await authClientHelpers.twoFactorDisable({ password: values.password })
  }
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Update your account password</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Form {...pwForm}>
            <form className="space-y-4" onSubmit={pwForm.handleSubmit(onChangePassword)}>
              <FormField
                control={pwForm.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={pwForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex gap-2">
                <Button type="submit" variant="default">
                  Change Password
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Change Email</CardTitle>
          <CardDescription>Update your email address</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              For verified accounts, a verification email will be sent to approve the change.
            </AlertDescription>
          </Alert>
          <Form {...emailForm}>
            <form className="space-y-4" onSubmit={emailForm.handleSubmit(onChangeEmail)}>
              <FormField
                control={emailForm.control}
                name="newEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="you@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex gap-2">
                <Button type="submit" variant="default">
                  Change Email
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Two-Factor Authentication</CardTitle>
          <CardDescription>Enable or disable TOTP-based 2FA</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Form {...confForm}>
            <form className="space-y-4">
              <FormField
                control={confForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm with password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="default"
                  onClick={confForm.handleSubmit(onEnable2FA)}
                >
                  Enable 2FA
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={confForm.handleSubmit(onDisable2FA)}
                >
                  Disable 2FA
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
