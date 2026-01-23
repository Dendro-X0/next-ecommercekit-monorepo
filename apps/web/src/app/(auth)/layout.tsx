import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen flex flex-col justify-center items-center bg-muted/30 p-4">
            <div className="absolute top-4 left-4 md:top-8 md:left-8">
                <Link
                    href="/"
                    className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Store
                </Link>
            </div>
            <div className="w-full max-w-md space-y-6">
                {children}
            </div>
            <div className="mt-8 text-center text-xs text-muted-foreground">
                <p>&copy; {new Date().getFullYear()} ModularShop. All rights reserved.</p>
            </div>
        </div>
    )
}
