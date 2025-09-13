"use client"

import { AuthCard } from "@/components/auth/auth-card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authClient } from "@/lib/auth-client"
import { zodResolver } from "@hookform/resolvers/zod"
import { AppLink } from "@/modules/shared/components/app-link"
import { useState } from "react"
import type { ReactElement } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

const MagicSchema = z.object({ email: z.string().email() })
type MagicValues = z.infer<typeof MagicSchema>

function SendButton(props: { readonly loading: boolean; readonly children: string }): ReactElement {
  return (
    <Button className="w-full" loading={props.loading}>
      {props.children}
    </Button>
  )
}

export default function MagicLinkPage(): ReactElement {
  const [message, setMessage] = useState<string | undefined>(undefined)
  const [error, setError] = useState<string | undefined>(undefined)
  const form = useForm<MagicValues>({
    resolver: zodResolver(MagicSchema),
    defaultValues: { email: "" },
  })

  async function onSubmit(values: MagicValues): Promise<void> {
    setMessage(undefined)
    setError(undefined)
    const { error: sendError } = await authClient.signIn.magicLink({
      email: values.email,
      callbackURL: "/dashboard/user",
    })
    if (sendError) {
      setError(sendError.message)
    } else {
      setMessage("Check your email for the magic link to sign in.")
    }
  }

  return (
    <AuthCard
      title="Sign in with magic link"
      description="Enter your email to receive a secure sign-in link"
    >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <Label htmlFor="email">Email</Label>
                  <FormControl>
                    <Input id="email" type="email" placeholder="Enter your email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <SendButton loading={form.formState.isSubmitting}>Send magic link</SendButton>
          </form>
        </Form>
        <div className="text-center">
          <AppLink href="/auth/login" className="text-sm text-primary hover:underline">
            Back to sign in
          </AppLink>
        </div>
    </AuthCard>
  )
}
