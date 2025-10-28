"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft } from "lucide-react"
import type { ReactElement } from "react"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import { showToast } from "@/lib/utils/toast"
import { AppLink } from "@/modules/shared/components/app-link"

const ForgotPasswordSchema = z.object({
  email: z.string().email(),
})

type ForgotPasswordValues = z.infer<typeof ForgotPasswordSchema>

function SubmitButton(props: { readonly loading: boolean }): ReactElement {
  return (
    <Button type="submit" className="w-full" loading={props.loading} disabled={props.loading}>
      Send reset link
    </Button>
  )
}

export function ForgotPasswordForm() {
  /** Local success state to switch UI after request */
  const [success, setSuccess] = useState<boolean>(false)
  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(ForgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  })

  useEffect(() => {
    // No side-effects on mount
  }, [])

  async function onSubmit(values: ForgotPasswordValues): Promise<void> {
    const origin: string = typeof window !== "undefined" ? window.location.origin : ""
    const redirectTo: string = origin ? `${origin}/auth/reset-password` : "/auth/reset-password"
    // Debug: log redirect to help diagnose Invalid redirectURL
    // eslint-disable-next-line no-console
    console.info("[ForgotPassword] redirectTo:", redirectTo)
    const { error } = await authClient.requestPasswordReset({
      email: values.email,
      redirectTo,
    })
    if (error) {
      const message: string = error.message || "Failed to send reset link"
      form.setError("email", { type: "server", message })
    } else {
      form.reset(values)
      setSuccess(true)
      showToast("Password reset link sent", { type: "success" })
    }
  }

  if (success) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Check your email</CardTitle>
          <CardDescription className="text-center">
            If an account exists for that email, we&apos;ll send password reset instructions.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <AppLink href="/auth/login" className="w-full">
            <Button variant="outline" className="w-full bg-transparent">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to login
            </Button>
          </AppLink>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Forgot password?</CardTitle>
        <CardDescription className="text-center">
          Enter your email address. If an account exists, we&apos;ll send a link to reset your password.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="john.doe@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <SubmitButton loading={form.formState.isSubmitting} />
          </form>
        </Form>
      </CardContent>
      <CardFooter>
        <AppLink href="/auth/login" className="w-full">
          <Button variant="outline" className="w-full bg-transparent">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to login
          </Button>
        </AppLink>
      </CardFooter>
    </Card>
  )
}
