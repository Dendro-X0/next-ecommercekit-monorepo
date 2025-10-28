import { LoginForm } from "@/components/auth/login-form"
import { ResendVerificationForm } from "@/components/auth/resend-verification-form"

export default function LoginPage() {
  return (
    <div className="mx-auto w-full max-w-md space-y-6">
      <LoginForm />
      <ResendVerificationForm />
    </div>
  )
}
