"use client"

import type { LucideIcon } from "lucide-react"
import { ArrowRight, ChevronLeft, ChevronRight, Star } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  type CarouselApi,
} from "@/components/ui/carousel"
import { SafeImage } from "@/components/ui/safe-image"
import { cn } from "@/lib/utils"
import { AppLink } from "../../shared/components/app-link"

type HeroStat = Readonly<{ label: string; value: string }>
type Slide = Readonly<{
  id: number
  title: string
  subtitle: string
  description: string
  image: string
  cta: Readonly<{
    primary: Readonly<{ text: string; href: string; icon?: LucideIcon }>
    secondary: Readonly<{ text: string; href: string }>
  }>
  stats?: readonly HeroStat[]
  badge: string
}>

const heroSlides: readonly Slide[] = [
  {
    id: 1,
    title: "Next.js Ecommerce Starterkit",
    subtitle: "Ship faster with best practices",
    description:
      "A comprehensive, production‑ready foundation: Next.js 16, TypeScript, Tailwind CSS, shadcn/ui, Better Auth, Drizzle, and a modular monorepo. Built to learn from and launch with.",
    image: "/shop1.png",
    cta: {
      primary: {
        text: "Star on GitHub",
        href: "https://github.com/Dendro-X0/next-ecommerce-starterkit",
      },
      secondary: { text: "Explore the demo", href: "/shop" },
    },
    stats: [],
    badge: "Open Source",
  },
  {
    id: 2,
    title: "Modern stack, real features",
    subtitle: "Performance, a11y, and DX",
    description:
      "SSR/ISR, routing, forms, state, and UI primitives that scale. Payments, auth, and an RBAC dashboard included so you can focus on your product.",
    image: "/admin_dashboard1.png",
    cta: {
      primary: { text: "Explore the demo", href: "/shop" },
      secondary: {
        text: "Read the README",
        href: "https://github.com/Dendro-X0/next-ecommerce-starterkit#readme",
      },
    },
    stats: [],
    badge: "Production Ready",
  },
  {
    id: 3,
    title: "Learn or launch today",
    subtitle: "Educational & commercial use",
    description:
      "Built for deep learning and real shipping. Clean structure, typed clients, and pragmatic patterns across auth, RBAC, payments, and more.",
    image: "/user_dashboard1.png",
    cta: {
      primary: { text: "Get started", href: "/getting-started" },
      secondary: {
        text: "Browse code",
        href: "https://github.com/Dendro-X0/next-ecommerce-starterkit",
      },
    },
    stats: [],
    badge: "Educational",
  },
]

export function HeroCarousel() {
  const [currentSlide, setCurrentSlide] = useState<number>(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(true)
  const [api, setApi] = useState<CarouselApi | null>(null)

  const scrollToIndex = useCallback(
    (index: number): void => {
      if (!api) return
      const total = api.scrollSnapList().length
      const clamped = ((index % total) + total) % total
      api.scrollTo(clamped)
    },
    [api],
  )

  // Keep the dot indicator in sync with Embla selection
  useEffect(() => {
    if (!api) return
    const handleSelect = (): void => {
      try {
        setCurrentSlide(api.selectedScrollSnap())
      } catch {
        /* no-op */
      }
    }
    handleSelect()
    api.on("select", handleSelect)
    api.on("reInit", handleSelect)
    return () => {
      try {
        api.off("select", handleSelect)
        api.off("reInit", handleSelect)
      } catch {
        /* no-op */
      }
    }
  }, [api])

  useEffect(() => {
    if (!isAutoPlaying) return
    const id = window.setInterval(() => {
      scrollToIndex(currentSlide + 1)
    }, 5000)
    return () => window.clearInterval(id)
  }, [currentSlide, isAutoPlaying, scrollToIndex])

  const nextSlide = (): void => {
    if (api) api.scrollNext()
    setIsAutoPlaying(false)
  }

  const prevSlide = (): void => {
    if (api) api.scrollPrev()
    setIsAutoPlaying(false)
  }

  const goToSlide = (index: number): void => {
    scrollToIndex(index)
    setIsAutoPlaying(false)
  }

  return (
    <Carousel
      aria-label="Featured slides"
      aria-live="polite"
      setApi={setApi}
      className="relative w-full h-[600px] lg:h-[700px] overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/5"
      opts={{ loop: false }}
    >
      <CarouselContent className="h-full">
        {heroSlides.map((s) => (
          <CarouselItem key={s.id} className="relative h-[600px] lg:h-[700px]">
            <div className="absolute inset-0">
              <SafeImage
                src={s.image || "/placeholder.svg"}
                alt={s.title}
                fill
                sizes="100vw"
                priority={s.id === 1}
                fetchPriority={s.id === 1 ? "high" : "low"}
                className="object-cover opacity-20"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/70 to-background/90" />
            </div>
            <div className="relative z-10 container mx-auto px-4 h-full flex items-center">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center w-full">
                <div className="space-y-6 text-center lg:text-left">
                  <div className="space-y-4">
                    <Badge variant="outline" className="text-sm">{s.badge}</Badge>
                    <div className="space-y-2">
                      <h1 className="text-4xl lg:text-6xl font-bold tracking-tight">{s.title}</h1>
                      <h2 className="text-xl lg:text-2xl text-primary font-semibold">{s.subtitle}</h2>
                    </div>
                    <p className="text-lg text-muted-foreground max-w-2xl">{s.description}</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                    <Button size="lg" asChild>
                      <AppLink href={s.cta.primary.href}>
                        {s.cta.primary.icon && <s.cta.primary.icon className="mr-2 h-5 w-5" />}
                        {s.cta.primary.text}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </AppLink>
                    </Button>
                    <Button size="lg" variant="outline" asChild>
                      <AppLink href={s.cta.secondary.href}>{s.cta.secondary.text}</AppLink>
                    </Button>
                  </div>
                </div>
                <div className="relative hidden lg:block">
                  <div className="relative aspect-square lg:aspect-[4/3] overflow-hidden rounded-2xl bg-muted border flex items-center justify-center">
                    <SafeImage
                      src={s.image || "/placeholder.svg"}
                      alt={s.title}
                      fill
                      sizes="(max-width: 1024px) 0px, 40vw"
                      className="object-cover"
                    />
                  </div>
                  <div className="absolute -top-4 -left-4 bg-card border rounded-lg p-4 shadow-lg">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <div className="text-sm font-medium">Open Source</div>
                    </div>
                    <div className="text-xs text-muted-foreground">MIT License</div>
                  </div>
                  <div className="absolute -bottom-4 -right-4 bg-card border rounded-lg p-4 shadow-lg">
                    <div className="text-sm font-medium">Production Ready</div>
                    <div className="text-xs text-muted-foreground">Deploy anywhere</div>
                  </div>
                </div>
              </div>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 mt-12">
        <div className="flex items-center gap-2 bg-background/80 backdrop-blur border rounded-full px-3 py-2 shadow-md">
          <Button
            variant="outline"
            size="icon"
            onClick={prevSlide}
            className="w-8 h-8 rounded-full"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex space-x-2 px-1">
            {heroSlides.map((slide, index) => (
              <button
                type="button"
                key={slide.id}
                onClick={() => goToSlide(index)}
                className="w-6 h-6 flex items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black dark:focus-visible:ring-white ring-offset-2 ring-offset-background"
                aria-label={`Go to slide ${index + 1}`}
                aria-current={currentSlide === index ? "true" : undefined}
                title={`Go to slide ${index + 1}`}
              >
                <span
                  className={cn(
                    "w-3 h-3 rounded-full border shadow",
                    currentSlide === index
                      ? "bg-primary border-primary/70 shadow-primary/20 scale-110"
                      : "bg-background/70 border-border hover:bg-background",
                  )}
                />
              </button>
            ))}
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={nextSlide}
            className="w-8 h-8 rounded-full"
            aria-label="Next slide"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="absolute top-4 right-4 z-20">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsAutoPlaying(!isAutoPlaying)}
          className="text-xs bg-background/80 backdrop-blur"
          aria-pressed={isAutoPlaying}
          aria-label={isAutoPlaying ? "Pause autoplay" : "Resume autoplay"}
        >
          {isAutoPlaying ? "Pause" : "Play"}
        </Button>
      </div>
      <CarouselPrevious className="hidden" />
      <CarouselNext className="hidden" />
    </Carousel>
  )
}
