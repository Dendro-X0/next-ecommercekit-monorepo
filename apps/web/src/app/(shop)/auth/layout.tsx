import type { ReactNode } from "react"

/**
 * AuthLayout wraps all pages under `(shop)/auth/*` to ensure consistent spacing and
 * visual rhythm across the entire auth flow (login, signup, forgot password, etc.).
 */
export default function AuthLayout(props: Readonly<{ children: ReactNode }>): React.ReactElement {
  const { children } = props
  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4">
        <div className="flex min-h-[80vh] items-center justify-center py-12">
          <div className="w-full max-w-xl mx-auto flex flex-col items-center">{children}</div>
        </div>
      </div>
    </main>
  )
}
