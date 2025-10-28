"use client"

import { useMutation } from "@tanstack/react-query"
import { Mail, MapPin, Phone, Send } from "lucide-react"
import type React from "react"
import { useEffect, useId, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { contactApi } from "@/lib/data/contact"
import { showToast } from "@/lib/utils/toast"
import type { ContactFormData } from "@/types/contact"

const subjects = [
  "General Inquiry",
  "Order Support",
  "Product Question",
  "Technical Issue",
  "Partnership",
  "Other",
]

export function ContactForm() {
  const uid = useId()
  const fid = (name: string): string => `${uid}-${name}`
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [formData, setFormData] = useState<ContactFormData>({
    name: "",
    email: "",
    subject: "",
    message: "",
    phone: "",
  })
  const successRef = useRef<HTMLOutputElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const phoneRef = useRef<HTMLInputElement>(null)
  const subjectRef = useRef<HTMLButtonElement>(null)
  const messageRef = useRef<HTMLTextAreaElement>(null)
  const [honeypot, setHoneypot] = useState<string>("")
  const [startTs] = useState<number>(Date.now())

  type FieldErrors = Readonly<{
    name?: string
    email?: string
    subject?: string
    message?: string
    phone?: string
  }>
  const [errors, setErrors] = useState<FieldErrors>({})

  const submitMutation = useMutation({
    mutationFn: contactApi.submitContact,
  })

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    // Bot protections
    if (honeypot.trim().length > 0) {
      showToast("Unable to submit. Please contact support if this is an error.", { type: "error" })
      return
    }
    const elapsed = Date.now() - startTs
    if (elapsed < 2000) {
      showToast("Please take a moment to complete the form before submitting.", { type: "error" })
      return
    }
    const nextErrors = validate(formData)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      focusFirstError(nextErrors)
      return
    }
    try {
      await submitMutation.mutateAsync(formData)
      setIsSubmitted(true)
      showToast("Message sent successfully", { type: "success" })
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to send message"
      showToast(message, { type: "error" })
    }
  }

  const handleChange = (field: keyof ContactFormData, value: string) => {
    setFormData((prev: ContactFormData) => ({ ...prev, [field]: value }))
    setErrors((prev: FieldErrors) => ({ ...prev, [field]: undefined }))
  }

  useEffect(() => {
    if (isSubmitted) {
      successRef.current?.focus()
    }
  }, [isSubmitted])

  const validate = (data: Readonly<ContactFormData>): FieldErrors => {
    const next: Record<string, string> = {}
    const nameOk = data.name.trim().length >= 2
    if (!nameOk) next.name = "Please enter your full name (min 2 characters)."
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)
    if (!emailOk) next.email = "Please enter a valid email address."
    if (!data.subject) next.subject = "Please select a subject."
    const messageOk = data.message.trim().length >= 10
    if (!messageOk) next.message = "Please provide more details (min 10 characters)."
    if (data.phone) {
      const digits = data.phone.replace(/\D/g, "")
      if (digits.length < 7) next.phone = "Please enter a valid phone number."
    }
    return next as FieldErrors
  }

  const focusFirstError = (errs: FieldErrors): void => {
    if (errs.name) {
      nameRef.current?.focus()
      return
    }
    if (errs.email) {
      emailRef.current?.focus()
      return
    }
    if (errs.subject) {
      subjectRef.current?.focus()
      return
    }
    if (errs.message) {
      messageRef.current?.focus()
      return
    }
    if (errs.phone) {
      phoneRef.current?.focus()
    }
  }

  if (isSubmitted) {
    return (
      <Card>
        <CardContent className="pt-6">
          <output
            ref={successRef}
            tabIndex={-1}
            aria-live="polite"
            className="text-center space-y-4"
          >
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <Send className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Message sent successfully!</h3>
              <p className="text-muted-foreground">
                Thank you for contacting us. We'll get back to you within 24 hours.
              </p>
            </div>
            <Button onClick={() => setIsSubmitted(false)} variant="outline">
              Send another message
            </Button>
          </output>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Send us a message</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4" aria-busy={submitMutation.isPending}>
          {/* Honeypot & time-trap */}
          <input
            type="text"
            id={fid("company")}
            name="company"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            className="hidden"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
          />
          <input type="hidden" name="_start" value={String(startTs)} readOnly />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={fid("name")}>Full Name *</Label>
              <Input
                id={fid("name")}
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                autoComplete="name"
                aria-required="true"
                aria-invalid={Boolean(errors.name) || undefined}
                aria-describedby={errors.name ? fid("name-error") : undefined}
                ref={nameRef}
                required
              />
              {errors.name && (
                <p id={fid("name-error")} className="text-sm text-destructive">
                  {errors.name}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor={fid("email")}>Email *</Label>
              <Input
                id={fid("email")}
                type="email"
                placeholder="john@example.com"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                autoComplete="email"
                inputMode="email"
                aria-required="true"
                aria-invalid={Boolean(errors.email) || undefined}
                aria-describedby={errors.email ? fid("email-error") : undefined}
                ref={emailRef}
                required
              />
              {errors.email && (
                <p id={fid("email-error")} className="text-sm text-destructive">
                  {errors.email}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={fid("phone")}>
                Phone (optional)
              </Label>
              <Input
                id={fid("phone")}
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                autoComplete="tel"
                inputMode="tel"
                aria-invalid={Boolean(errors.phone) || undefined}
                aria-describedby={errors.phone ? fid("phone-error") : undefined}
                ref={phoneRef}
              />
              {errors.phone && (
                <p id={fid("phone-error")} className="text-sm text-destructive">
                  {errors.phone}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor={fid("subject")}>
                Subject *
              </Label>
              <Select
                value={formData.subject}
                onValueChange={(value) => handleChange("subject", value)}
              >
                <SelectTrigger
                  aria-label="Subject"
                  ref={subjectRef}
                  aria-invalid={Boolean(errors.subject) || undefined}
                  aria-describedby={errors.subject ? fid("subject-error") : undefined}
                  className="w-full"
                >
                  <SelectValue placeholder="Select a subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject} value={subject}>
                      {subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.subject && (
                <p id={fid("subject-error")} className="text-sm text-destructive">
                  {errors.subject}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={fid("message")}>
              Message *
            </Label>
            <Textarea
              id={fid("message")}
              placeholder="Tell us how we can help you..."
              value={formData.message}
              onChange={(e) => handleChange("message", e.target.value)}
              rows={6}
              aria-required="true"
              aria-invalid={Boolean(errors.message) || undefined}
              aria-describedby={errors.message ? fid("message-error") : undefined}
              ref={messageRef}
              required
            />
            {errors.message && (
              <p id={fid("message-error")} className="text-sm text-destructive">
                {errors.message}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={submitMutation.isPending}>
            {submitMutation.isPending ? "Sending..." : "Send Message"}
            <Send className="h-4 w-4 ml-2" />
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

export function ContactInfo() {
  const toTelHref = (value: string): string => {
    const digits = value.replace(/[^\d+]/g, "")
    return `tel:${digits.startsWith("+") ? digits : `+${digits}`}`
  }
  const toMailHref = (value: string): string => `mailto:${value}`
  const contactDetails = [
    {
      icon: Phone,
      title: "Phone",
      details: ["+1 (555) 123-4567", "Mon-Fri 9AM-6PM EST"],
    },
    {
      icon: Mail,
      title: "Email",
      details: ["support@modularshop.com", "We reply within 24 hours"],
    },
    {
      icon: MapPin,
      title: "Address",
      details: ["123 Business Ave", "New York, NY 10001"],
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Get in touch</h2>
        <p className="text-muted-foreground">
          We'd love to hear from you. Send us a message and we'll respond as soon as possible.
        </p>
      </div>

      <div className="space-y-4">
        {contactDetails.map((item) => (
          <div key={item.title} className="flex items-start gap-4">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <item.icon className="h-5 w-5 text-primary" aria-hidden="true" />
            </div>
            <div>
              <h3 className="font-medium">{item.title}</h3>
              {item.details.map((detail, idx) => {
                if (item.title === "Phone" && idx === 0) {
                  return (
                    <a
                      key={`${item.title}-${detail}`}
                      href={toTelHref(detail)}
                      className="text-sm text-muted-foreground underline-offset-2 hover:underline"
                    >
                      {detail}
                    </a>
                  )
                }
                if (item.title === "Email" && idx === 0) {
                  return (
                    <a
                      key={`${item.title}-${detail}`}
                      href={toMailHref(detail)}
                      className="text-sm text-muted-foreground underline-offset-2 hover:underline"
                    >
                      {detail}
                    </a>
                  )
                }
                return (
                  <p key={`${item.title}-${detail}`} className="text-sm text-muted-foreground">
                    {detail}
                  </p>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Map embed */}
      <Card className="py-0">
        <CardContent className="p-0">
          {(() => {
            const addressLine =
              contactDetails.find((i) => i.title === "Address")?.details[0] ??
              "123 Business Ave, New York, NY 10001"
            const q = encodeURIComponent(addressLine)
            const src = `https://www.google.com/maps?q=${q}&output=embed`
            const link = `https://www.google.com/maps?q=${q}`
            return (
              <figure className="m-0">
                <div className="relative rounded-lg overflow-hidden">
                  <div className="aspect-[16/9] sm:aspect-[16/9] lg:aspect-[16/9]" />
                  <iframe
                    src={src}
                    title={`Map location for ${addressLine}`}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="absolute inset-0 w-full h-full border-0"
                  />
                </div>
                <figcaption className="sr-only">
                  Map showing location: {addressLine}. Open in Google Maps: {link}
                </figcaption>
              </figure>
            )
          })()}
        </CardContent>
      </Card>
    </div>
  )
}
