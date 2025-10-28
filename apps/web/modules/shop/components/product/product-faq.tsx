"use client"

import { ChevronDown } from "lucide-react"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { cn } from "@/lib/utils/index"

interface FAQ {
  id: string
  question: string
  answer: string
}

interface ProductFAQProps {
  productId: string
  faqs?: FAQ[]
}

const defaultFAQs: FAQ[] = [
  {
    id: "1",
    question: "What is the return policy for this product?",
    answer:
      "We offer a 30-day return policy for all products. Items must be in original condition with tags attached. Return shipping is free for defective items, otherwise customer pays return shipping.",
  },
  {
    id: "2",
    question: "How long does shipping take?",
    answer:
      "Standard shipping takes 3-5 business days. Express shipping (1-2 business days) and overnight shipping options are available at checkout for an additional fee.",
  },
  {
    id: "3",
    question: "Is this product covered by warranty?",
    answer:
      "Yes, this product comes with a 1-year manufacturer warranty covering defects in materials and workmanship. Extended warranty options are available for purchase.",
  },
  {
    id: "4",
    question: "What payment methods do you accept?",
    answer:
      "We accept all major credit cards (Visa, MasterCard, American Express), PayPal, Apple Pay, Google Pay, and buy-now-pay-later options through Klarna and Afterpay.",
  },
  {
    id: "5",
    question: "Can I track my order?",
    answer:
      "Yes, once your order ships, you'll receive a tracking number via email. You can also track your order status in your account dashboard or by visiting our order tracking page.",
  },
  {
    id: "6",
    question: "Is this product authentic?",
    answer:
      "Yes, we guarantee that all products sold on our platform are 100% authentic. We work directly with manufacturers and authorized distributors to ensure product authenticity.",
  },
]

export function ProductFAQ({ faqs = defaultFAQs }: Omit<ProductFAQProps, "productId">) {
  const [openItems, setOpenItems] = useState<string[]>([])

  const toggleItem = (itemId: string) => {
    setOpenItems((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId],
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Frequently Asked Questions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {faqs.map((faq) => (
          <Collapsible
            key={faq.id}
            open={openItems.includes(faq.id)}
            onOpenChange={() => toggleItem(faq.id)}
          >
            <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border p-4 text-left hover:bg-accent transition-colors">
              <span className="font-medium">{faq.question}</span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform duration-200",
                  openItems.includes(faq.id) && "rotate-180",
                )}
              />
            </CollapsibleTrigger>
            <CollapsibleContent className="px-4 pb-4">
              <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
            </CollapsibleContent>
          </Collapsible>
        ))}
      </CardContent>
    </Card>
  )
}
