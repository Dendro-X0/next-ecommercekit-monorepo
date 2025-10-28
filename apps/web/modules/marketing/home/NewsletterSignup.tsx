"use client"

import type React from "react"
import { useId, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function NewsletterSignup() {
  const [email, setEmail] = useState("")
  const uid = useId()
  const emailId = `${uid}-newsletter-email`
  const helpId = `${uid}-newsletter-help`

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle newsletter signup
    console.log("Newsletter signup:", email)
    setEmail("")
  }

  return (
    <section
      className="py-16 bg-black text-white"
      style={{ contentVisibility: "auto", containIntrinsicSize: "1200px 520px" }}
    >
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-black text-white mb-8 uppercase">
            STAY UP TO DATE ABOUT
            <br />
            OUR LATEST OFFERS
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
            <div className="relative">
              <label htmlFor={emailId} className="sr-only">
                Email address
              </label>
              <Input
                type="email"
                id={emailId}
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                aria-describedby={helpId}
                className="w-full px-6 py-4 rounded-full !bg-white !text-gray-900 placeholder:!text-gray-500 border-0 focus:ring-2 focus:ring-white"
              />
            </div>
            <p id={helpId} className="sr-only">
              We will use your email to send occasional updates. You can unsubscribe at any time.
            </p>

            <Button
              type="submit"
              className="w-full bg-white text-black hover:bg-gray-100 px-6 py-4 rounded-full font-medium text-lg"
            >
              Subscribe to Newsletter
            </Button>
          </form>
        </div>
      </div>
    </section>
  )
}
