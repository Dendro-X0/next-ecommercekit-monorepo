"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import type React from "react"
import type { ReactElement } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
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
import { PasswordStrengthIndicator } from "@/components/ui/password-strength-indicator"
import { authClient } from "@/lib/auth-client"
import { showToast } from "@/lib/utils/toast"

const ResetPasswordSchema = z
  .object({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6),
    token: z.string().min(1),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

type ResetPasswordValues = z.infer<typeof ResetPasswordSchema>

function SubmitButton(props: { readonly loading: boolean }): ReactElement {
  return (
    <Button type="submit" className="w-full" loading={props.loading} disabled={props.loading}>
      Reset password
    </Button>
  )
}

interface ResetPasswordFormProps {
  token: string
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps): React.JSX.Element {
  const router = useRouter()
  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
      token: token,
    },
  })

  // No side-effects on mount; removed unnecessary effect to satisfy exhaustive-deps

  async function onSubmit(values: ResetPasswordValues): Promise<void> {
    const { error } = await authClient.resetPassword({
      newPassword: values.password,
      token: values.token,
    })
    if (error) {
      form.setError("password", { type: "server", message: error.message })
    } else {
      showToast("Password reset successfully", { type: "success" })
      router.push("/auth/login?reset=1")
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Reset your password</CardTitle>
        <CardDescription className="text-center">Enter your new password below</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <input type="hidden" {...form.register("token")} />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <PasswordStrengthIndicator password={field.value} />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm new password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <SubmitButton loading={form.formState.isSubmitting} />
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
