import { Footer } from "@/components/layout/footer"
import { Header } from "@/components/layout/header"
import { ClientIslands } from "../client-islands"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const disableToaster: boolean =
    (process.env.NEXT_PUBLIC_DISABLE_TOASTER ?? "false").toLowerCase() === "true"
  const disableCartHydrator: boolean =
    (process.env.NEXT_PUBLIC_DISABLE_CART_HYDRATOR ?? "false").toLowerCase() === "true"
  const disableAffiliate: boolean =
    (process.env.NEXT_PUBLIC_DISABLE_AFFILIATE_TRACKER ?? "false").toLowerCase() === "true"
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1">
        {children}
        {/* Mount client islands after main content to minimize risk of above-the-fold CLS */}
        <ClientIslands
          enableAffiliate={!disableAffiliate}
          enableCartHydrator={!disableCartHydrator}
          enableToaster={!disableToaster}
        />
      </div>
      <Footer />
    </div>
  )
}
