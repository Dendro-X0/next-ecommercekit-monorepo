"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
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
import { PasswordStrengthIndicator } from "@/components/ui/password-strength-indicator"
import { authClientHelpers } from "@/lib/auth-client-helpers"
import { showToast } from "@/lib/utils/toast"
import { AppLink } from "@/modules/shared/components/app-link"
import { SocialLogin } from "./social-login"

const usernamePattern = /^[a-zA-Z0-9._-]{3,30}$/
const SignupSchema = z
  .object({
    email: z.string().email(),
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(30, "Username must be at most 30 characters")
      .regex(usernamePattern, "Use letters, numbers, dot, underscore or hyphen"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6),
    agreeToTerms: z.boolean().refine((v) => v === true, { message: "You must agree to the terms" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

type SignupFormValues = z.infer<typeof SignupSchema>

/**
 * Submit button with loading state.
 */
function SubmitButton(props: { readonly loading: boolean }): ReactElement {
  return (
    <Button type="submit" className="w-full" loading={props.loading} disabled={props.loading}>
      Create account
    </Button>
  )
}

/**
 * Sign up form using Better Auth client.
 */
export function SignUpForm() {
  const router = useRouter()
  const [usernameStatus, setUsernameStatus] = useState<{
    readonly status: "idle" | "checking" | "available" | "unavailable"
    readonly message?: string
  }>({ status: "idle" })
  const form = useForm<SignupFormValues>({
    resolver: zodResolver(SignupSchema),
    defaultValues: {
      email: "",
      username: "",
      password: "",
      confirmPassword: "",
      agreeToTerms: false,
    },
  })

  useEffect(() => {
    // No side-effects on mount
  }, [])

  const checkUsername = async (username: string): Promise<void> => {
    const u: string = username.trim()
    if (!u || !usernamePattern.test(u)) {
      setUsernameStatus({ status: "idle" })
      return
    }
    setUsernameStatus({ status: "checking" })
    const { data, error } = await authClientHelpers.isUsernameAvailable({ username: u })
    if (error) {
      setUsernameStatus({
        status: "unavailable",
        message: error.message || "Username check failed",
      })
      return
    }
    setUsernameStatus({
      status: data?.available ? "available" : "unavailable",
      message: data?.available ? "Username is available" : "Username is taken",
    })
  }

  async function onSubmit(values: SignupFormValues): Promise<void> {
    if (usernameStatus.status === "unavailable") {
      form.setError("username", {
        type: "server",
        message: usernameStatus.message || "Username is taken",
      })
      return
    }
    const { error } = await authClientHelpers.signUpEmail({
      email: values.email,
      username: values.username,
      password: values.password,
    })
    if (error) {
      const msg = error.message || "Signup failed"
      if (msg.toLowerCase().includes("username")) {
        form.setError("username", { type: "server", message: msg })
      } else {
        form.setError("email", { type: "server", message: msg })
      }
      return
    }
    showToast("Account created successfully. Please verify your email.", { type: "success" })
    router.push(`/auth/verify-email?email=${encodeURIComponent(values.email)}`)
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle>Create an account</CardTitle>
        <CardDescription>Enter your information to get started</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Name field removed per product decision; users can set display name later in profile */}
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="yourname"
                      {...field}
                      onBlur={async (e) => {
                        field.onBlur()
                        await checkUsername(e.target.value)
                      }}
                      onChange={async (e) => {
                        field.onChange(e)
                        setUsernameStatus({ status: "idle" })
                      }}
                    />
                  </FormControl>
                  {usernameStatus.status === "checking" && (
                    <p className="text-xs text-muted-foreground">Checking availability...</p>
                  )}
                  {usernameStatus.status === "available" && (
                    <p className="text-xs text-green-600">{usernameStatus.message}</p>
                  )}
                  {usernameStatus.status === "unavailable" && (
                    <p className="text-xs text-destructive">{usernameStatus.message}</p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
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
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
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
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="agreeToTerms"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      I agree to the{" "}
                      <AppLink href="/terms" className="text-primary hover:underline">
                        Terms of Service
                      </AppLink>{" "}
                      and{" "}
                      <AppLink href="/privacy" className="text-primary hover:underline">
                        Privacy Policy
                      </AppLink>
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />
            <SubmitButton loading={form.formState.isSubmitting} />
          </form>
        </Form>

        <SocialLogin />
      </CardContent>
      <CardFooter>
        <p className="text-center text-sm text-muted-foreground w-full">
          Already have an account?{" "}
          <AppLink href="/auth/login" className="text-primary hover:underline">
            Sign in
          </AppLink>
        </p>
      </CardFooter>
    </Card>
  )
}
