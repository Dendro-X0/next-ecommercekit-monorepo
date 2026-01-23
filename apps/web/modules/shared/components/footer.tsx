import { Facebook, Instagram, Twitter } from "lucide-react"
import Image from "next/image"
import { AppLink } from "./app-link"

const footerSections = [
  {
    title: "COMPANY",
    links: [
      { name: "About", href: "/about" },
      { name: "Features", href: "/features" },
      { name: "Works", href: "/works" },
      { name: "Career", href: "/career" },
    ],
  },
  {
    title: "HELP",
    links: [
      { name: "Customer Support", href: "/support" },
      { name: "Delivery Details", href: "/delivery" },
      { name: "Terms & Conditions", href: "/terms" },
      { name: "Privacy Policy", href: "/privacy" },
    ],
  },
  {
    title: "FAQ",
    links: [
      { name: "Account", href: "/faq/account" },
      { name: "Manage Deliveries", href: "/faq/deliveries" },
      { name: "Orders", href: "/faq/orders" },
      { name: "Payments", href: "/faq/payments" },
    ],
  },
  {
    title: "RESOURCES",
    links: [
      { name: "Free eBooks", href: "/resources/ebooks" },
      { name: "Development Tutorial", href: "/resources/tutorial" },
      { name: "How to - Blog", href: "/resources/blog" },
      { name: "Youtube Playlist", href: "/resources/youtube" },
    ],
  },
]

const paymentMethods = [
  { name: "Visa", logo: "💳" },
  { name: "Mastercard", logo: "💳" },
  { name: "PayPal", logo: "💳" },
  { name: "Apple Pay", logo: "💳" },
  { name: "Google Pay", logo: "💳" },
]

export function Footer() {
  return (
    <footer className="bg-gray-100 dark:bg-gray-900 pt-16 pb-8">
      <div className="container mx-auto px-4">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 mb-12">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <AppLink href="/" className="inline-flex items-center mb-6 py-1.5">
              <span className="text-2xl font-black text-black dark:text-white">ModularShop</span>
            </AppLink>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-sm">
              ModularShop is an end-to-end, production-ready foundation for modern commerce.
            </p>
            <div className="flex gap-4">
              <AppLink
                href="#"
                aria-label="Visit our Twitter"
                title="Twitter"
                className="w-10 h-10 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
              >
                <Twitter className="h-5 w-5" aria-hidden />
              </AppLink>
              <AppLink
                href="#"
                aria-label="Visit our Facebook"
                title="Facebook"
                className="w-10 h-10 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
              >
                <Facebook className="h-5 w-5" aria-hidden />
              </AppLink>
              <AppLink
                href="#"
                aria-label="Visit our Instagram"
                title="Instagram"
                className="w-10 h-10 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
              >
                <Instagram className="h-5 w-5" aria-hidden />
              </AppLink>
              <AppLink
                href="#"
                aria-label="Visit our GitHub"
                title="GitHub"
                className="w-10 h-10 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
              >
                <Image
                  src="/icons/github.svg"
                  alt=""
                  width={20}
                  height={20}
                  aria-hidden
                  className="opacity-80"
                />
              </AppLink>
            </div>
          </div>

          {/* Footer Links */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h2 className="font-semibold text-black dark:text-white mb-4 text-sm tracking-wider">
                {section.title}
              </h2>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <AppLink
                      href={link.href}
                      className="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors text-sm"
                    >
                      {link.name}
                    </AppLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              ModularShop © 2026, All Rights Reserved
            </p>

            <div className="flex flex-wrap items-center gap-3 sm:gap-4 justify-center md:justify-start">
              {paymentMethods.map((method) => (
                <div
                  key={method.name}
                  className="w-12 h-8 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 flex items-center justify-center text-lg"
                >
                  {method.logo}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
