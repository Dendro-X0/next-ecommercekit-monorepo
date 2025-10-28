"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useQueryClient } from "@tanstack/react-query"
import { Shield } from "lucide-react"
import { useRouter } from "next/navigation"
import type React from "react"
import type { ReactElement } from "react"
import { useEffect, useState } from "react"
import { type SubmitHandler, useForm } from "react-hook-form"
import { z } from "zod"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
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

const CODE_LENGTH: number = 6 as const

const TwoFactorSchema = z.object({
  code: z.string().min(CODE_LENGTH).max(CODE_LENGTH),
  trustDevice: z.boolean(),
})

type TwoFactorValues = z.infer<typeof TwoFactorSchema>

function SubmitButton(props: { readonly loading: boolean }): ReactElement {
  return (
    <Button type="submit" className="w-full" loading={props.loading}>
      Verify
    </Button>
  )
}

/**
 * TwoFactorForm verifies a TOTP code and optional trusted-device flag.
 * On success, it primes the session cache and navigates to the dashboard.
 */
export function TwoFactorForm(): React.JSX.Element {
  const [message, setMessage] = useState<string | undefined>(undefined)
  const [error, setError] = useState<string | undefined>(undefined)
  const router = useRouter()
  const queryClient = useQueryClient()
  const form = useForm<TwoFactorValues>({
    resolver: zodResolver(TwoFactorSchema),
    defaultValues: {
      code: "",
      trustDevice: false,
    },
  })

  useEffect(() => {
    const subscription = form.watch(() => {
      setMessage(undefined)
      setError(undefined)
    })
    return () => subscription.unsubscribe()
  }, [form])

  const onSubmit: SubmitHandler<TwoFactorValues> = async (values): Promise<void> => {
    const { error: verifyError } = await authClientHelpers.twoFactorVerifyTotp({
      code: values.code,
      trustDevice: values.trustDevice,
    })
    if (verifyError) {
      setError(verifyError.message)
      return
    }
    // Prime session cache and route to dashboard
    const { data } = await authClient.getSession()
    const u = data?.user as
      | {
          readonly id?: string
          readonly email?: string
          readonly name?: unknown
          readonly image?: unknown
          readonly roles?: unknown
          readonly emailVerified?: unknown
        }
      | undefined
    const user = u
      ? {
          id: u.id,
          email: u.email,
          name: typeof u.name === "string" ? (u.name as string) : null,
          image: typeof u.image === "string" ? (u.image as string) : null,
          roles:
            Array.isArray(u.roles) && (u.roles as unknown[]).every((x) => typeof x === "string")
              ? (u.roles as readonly string[])
              : undefined,
          emailVerified:
            typeof u.emailVerified === "boolean" ? (u.emailVerified as boolean) : undefined,
        }
      : null
    queryClient.setQueryData(["session"], { user })
    const roles: readonly string[] = Array.isArray(user?.roles)
      ? (user?.roles as readonly string[])
      : ([] as const)
    const target: string = roles.includes("admin") ? "/dashboard/admin" : "/dashboard/user"
    await router.prefetch(target)
    router.replace(target)
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <Shield className="h-6 w-6 text-primary" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold text-center">Two-factor authentication</CardTitle>
        <CardDescription className="text-center">
          Enter the 6-digit code from your authenticator app
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {message && (
              <Alert>
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Verification code</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="000000"
                      className="text-center text-2xl tracking-widest"
                      maxLength={CODE_LENGTH}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="trustDevice"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Trust this device for 30 days</FormLabel>
                  </div>
                </FormItem>
              )}
            />
            <SubmitButton loading={form.formState.isSubmitting} />
          </form>
        </Form>
        <div className="text-center mt-4 text-sm text-muted-foreground">
          Use your authenticator app to generate a new code if needed. If you have lost access, use
          a backup code.
        </div>
      </CardContent>
    </Card>
  )
}
