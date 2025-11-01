"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useQueryClient } from "@tanstack/react-query"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { authClient } from "@/lib/auth-client"
import { authClientHelpers } from "@/lib/auth-client-helpers"
import { showToast } from "@/lib/utils/toast"
import { AppLink } from "@/modules/shared/components/app-link"

const LoginSchema = z.object({
  identifier: z.string().min(1, "Email or username is required"),
  password: z.string().min(6),
  rememberMe: z.coerce.boolean().default(false),
})

// Use input type to match zodResolver's expected input (since defaults make fields optional on input)
type LoginFormValues = z.input<typeof LoginSchema>

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
import { SocialLogin } from "./social-login"

function SubmitButton({ loading }: { readonly loading: boolean }) {
  return (
    <Button type="submit" className="w-full" loading={loading} disabled={loading}>
      Sign In
    </Button>
  )
}

export function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const queryClient = useQueryClient()
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      identifier: "",
      password: "",
      rememberMe: false,
    },
  })

  useEffect(() => {
    if (!params) return
    const verified = params.get("verified")
    const email = params.get("email")
    if (email && form.getValues("identifier") !== email) {
      form.setValue("identifier", email)
    }
    if (verified === "1") {
      showToast("Email verified. Please sign in to continue.", { type: "success" })
    }
  }, [form, params])

  const isEmail = (value: string): boolean => /.+@.+\..+/.test(value)

  async function onSubmit(values: LoginFormValues): Promise<void> {
    try {
      const { error } = isEmail(values.identifier)
        ? await authClientHelpers.signInEmail({
            email: values.identifier,
            password: values.password,
          })
        : await authClientHelpers.signInUsername({
            username: values.identifier,
            password: values.password,
          })
      if (error) {
        // Avoid account enumeration via precise error text
        form.setError("identifier", { type: "server", message: "Invalid email or password" })
        return
      }
      showToast("Signed in successfully", { type: "success" })
      const { data } = await authClient.getSession()
      const u: unknown = data?.user
      const roles: readonly string[] = ((): readonly string[] => {
        if (u && typeof u === "object" && "roles" in (u as Record<string, unknown>)) {
          const r = (u as { readonly roles?: unknown }).roles
          if (Array.isArray(r) && r.every((x) => typeof x === "string")) {
            return r as readonly string[]
          }
        }
        return [] as const
      })()
      // Prime the session cache to avoid post-login flicker.
      const user = ((): {
        readonly id?: string
        readonly email?: string
        readonly name?: string | null
        readonly image?: string | null
        readonly roles?: readonly string[]
        readonly emailVerified?: boolean
      } | null => {
        if (!u || typeof u !== "object") return null
        const o = u as {
          readonly id?: string
          readonly email?: string
          readonly name?: unknown
          readonly image?: unknown
          readonly roles?: unknown
          readonly emailVerified?: unknown
        }
        return {
          id: o.id,
          email: o.email,
          name: typeof o.name === "string" ? (o.name as string) : null,
          image: typeof o.image === "string" ? (o.image as string) : null,
          roles:
            Array.isArray(o.roles) && (o.roles as unknown[]).every((x) => typeof x === "string")
              ? (o.roles as readonly string[])
              : undefined,
          emailVerified:
            typeof o.emailVerified === "boolean" ? (o.emailVerified as boolean) : undefined,
        }
      })()
      queryClient.setQueryData(["session"], { user })
      const target: string = roles.includes("admin") ? "/dashboard/admin" : "/dashboard/user"
      await router.prefetch(target)
      router.push(target)
    } catch (e) {
      const message: string = e instanceof Error ? e.message : "Sign-in failed"
      showToast(message, { type: "error" })
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle>Welcome back</CardTitle>
        <CardDescription>Sign in to your account to continue</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="identifier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email or Username</FormLabel>
                  <FormControl>
                    <Input placeholder="you@example.com or yourname" {...field} />
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
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center justify-between -mt-1">
              <FormField
                control={form.control}
                name="rememberMe"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-2">
                    <FormControl>
                      <Checkbox
                        checked={!!field.value}
                        onCheckedChange={field.onChange}
                        aria-label="Remember me"
                      />
                    </FormControl>
                    <FormLabel className="!mt-0">Remember me</FormLabel>
                  </FormItem>
                )}
              />
              <AppLink
                href="/auth/forgot-password"
                className="text-sm text-primary hover:underline"
              >
                Forgot password?
              </AppLink>
            </div>
            <SubmitButton loading={form.formState.isSubmitting} />
          </form>
        </Form>

        <SocialLogin />
      </CardContent>
      <CardFooter>
        <p className="text-center text-sm text-muted-foreground w-full">
          Don&apos;t have an account?{" "}
          <AppLink href="/auth/signup" className="text-primary hover:underline">
            Sign up
          </AppLink>
        </p>
      </CardFooter>
    </Card>
  )
}
