import type { Metadata } from "next"
import { ContactForm, ContactInfo } from "@/components/contact/contact-form"

export const metadata: Metadata = {
  title: "Contact Us | Shop.co",
  description:
    "Have a question or need help? Contact Shop.co customer support for order assistance, product questions, and general inquiries.",
  openGraph: {
    title: "Contact Us | Shop.co",
    description:
      "Have a question or need help? Contact Shop.co customer support for order assistance, product questions, and general inquiries.",
    url: "/contact",
    type: "website",
  },
}

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* JSON-LD: ContactPage and Organization contactPoint */}
      <script type="application/ld+json">
        {JSON.stringify(
          [
            {
              "@context": "https://schema.org",
              "@type": "ContactPage",
              name: "Contact Us",
              url: "/contact",
              description:
                "Have a question or need help? Contact Shop.co customer support for order assistance, product questions, and general inquiries.",
            },
            {
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Shop",
              url: "/",
              contactPoint: [
                {
                  "@type": "ContactPoint",
                  telephone: "+1-555-123-4567",
                  contactType: "customer support",
                  areaServed: "US",
                  availableLanguage: ["English"],
                },
              ],
            },
          ],
          null,
          2,
        )}
      </script>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Have a question or need help? We&apos;re here to assist you. Get in touch with our team.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <ContactInfo />
          <ContactForm />
        </div>
      </div>
    </div>
  )
}
