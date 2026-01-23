"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, Mail } from "lucide-react"
import { useSearchParams } from "next/navigation"
import type { ReactElement } from "react"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Alert, AlertDescription } from "@/components/ui/alert"
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
import { AppLink } from "@/modules/shared/components/app-link"

const VerifyEmailSchema = z.object({ email: z.string().email() })
type VerifyEmailValues = z.infer<typeof VerifyEmailSchema>

/**
 * Submit button with loading state.
 */
function ResendButton(props: { readonly loading: boolean }): ReactElement {
  return (
    <Button variant="outline" className="w-full bg-transparent" loading={props.loading}>
      Resend verification email
    </Button>
  )
}

/**
 * Verify Email page allows users to request a new verification email.
 */
export default function VerifyEmailPage(): ReactElement {
  const [message, setMessage] = useState<string | undefined>(undefined)
  const [error, setError] = useState<string | undefined>(undefined)
  const params = useSearchParams()
  const form = useForm<VerifyEmailValues>({
    resolver: zodResolver(VerifyEmailSchema as never),
    defaultValues: { email: "" },
  })

  // Prefill email from query param if present
  useEffect(() => {
    if (!params) return
    const q = params.get("email")
    if (q && form.getValues("email") !== q) {
      form.reset({ email: q })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, form.getValues, form.reset])

  async function onSubmit(values: VerifyEmailValues): Promise<void> {
    setMessage(undefined)
    setError(undefined)
    const { error: sendError } = await authClient.sendVerificationEmail({
      email: values.email,
      callbackURL: `/auth/login?verified=1&email=${encodeURIComponent(values.email)}`,
    })
    if (sendError) {
      setError(sendError.message)
    } else {
      setMessage("Verification email sent. Please check your inbox.")
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <Mail className="h-6 w-6 text-primary" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold text-center">Verify your email</CardTitle>
        <CardDescription className="text-center">
          We&apos;ve sent a verification link to your email address
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {message && (
          <Alert>
            <Mail className="h-4 w-4" />
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <Alert>
          <Mail className="h-4 w-4" />
          <AlertDescription>
            Please check your email and click the verification link to activate your account. If you
            don&apos;t see the email, check your spam folder.
          </AlertDescription>
        </Alert>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 text-left">
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
            <div className="text-center">
              <ResendButton loading={form.formState.isSubmitting} />
            </div>
          </form>
        </Form>
      </CardContent>
      <CardFooter>
        <AppLink href="/auth/login" className="w-full">
          <Button variant="ghost" className="w-full">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to login
          </Button>
        </AppLink>
      </CardFooter>
    </Card>
  )
}
