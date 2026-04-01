import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { ArrowRightIcon, ChevronLeftIcon, ChevronRightIcon, SparklesIcon } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Button, buttonVariants } from '@/components/ui/button'
import { useStorefront } from '@/features/store/context/storefront-context'
import { formatCurrency, getPrimaryProductImage } from '@/features/store/lib/storefront-utils'
import { cn } from '@/lib/utils'

const backgroundGradients = [
  'linear-gradient(135deg, #f7ebde 0%, #ecd9c6 48%, #d8c6ea 100%)',
  'linear-gradient(135deg, #efe6f7 0%, #d9d1f1 52%, #f3eadf 100%)',
  'linear-gradient(135deg, #e4f1ec 0%, #cce4db 50%, #f3e6dc 100%)',
]

export function DealBanner() {
  const { products } = useStorefront()
  const promoProducts = products
    .filter((product) => product.promoSlider)
    .sort((left, right) => left.promoSliderOrder - right.promoSliderOrder || right.rating - left.rating)
    .slice(0, 3)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [direction, setDirection] = useState(1)

  useEffect(() => {
    if (promoProducts.length <= 1) {
      return
    }

    const autoPlayInterval = window.setInterval(() => {
      setDirection(1)
      setSelectedIndex((current) => (current + 1) % promoProducts.length)
    }, 5000)

    return () => window.clearInterval(autoPlayInterval)
  }, [promoProducts.length])

  if (promoProducts.length === 0) {
    return null
  }

  const activeSlide = promoProducts[selectedIndex] ?? promoProducts[0]
  const imageLeft = selectedIndex % 2 === 0

  return (
    <section className="relative overflow-hidden rounded-[2.2rem] border border-[#e3d5c7] shadow-[0_28px_72px_-48px_rgba(49,20,9,0.26)] transition-all duration-700 ease-in-out">
      <div
        className="relative overflow-hidden p-6 sm:p-8 md:p-10"
        style={{ background: backgroundGradients[selectedIndex % backgroundGradients.length] }}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.38),transparent_58%)]" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-1/3 bg-[linear-gradient(270deg,rgba(255,255,255,0.18),transparent)]" />

        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 flex-1">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={`${activeSlide.id}-left`}
                custom={direction}
                initial={{ opacity: 0, x: direction > 0 ? 34 : -34 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction > 0 ? -24 : 24 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className={cn('flex items-center gap-5 sm:gap-6', imageLeft ? 'flex-row' : 'flex-row-reverse')}
              >
                <motion.div
                  initial={{ opacity: 0, x: direction > 0 ? 46 : -46, scale: 0.98 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: direction > 0 ? -34 : 34, scale: 0.985 }}
                  transition={{ duration: 0.46, ease: [0.22, 1, 0.36, 1] }}
                  className="relative aspect-[4/3] w-full max-w-[180px] shrink-0 overflow-hidden rounded-[1.7rem] border border-white/60 bg-white/35 shadow-[0_22px_54px_-36px_rgba(38,27,19,0.28)] backdrop-blur-md sm:max-w-[220px] lg:max-w-[240px]"
                >
                  <img
                    src={getPrimaryProductImage(activeSlide)}
                    alt={activeSlide.name}
                    className="h-full w-full object-cover"
                  />
                </motion.div>

                <div className="min-w-0 flex-1">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.04 }}
                    className="inline-flex items-center gap-2 rounded-full border border-black/8 bg-white/55 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/80 backdrop-blur-sm sm:text-xs"
                  >
                    <SparklesIcon className="size-3.5 sm:size-4" />
                    {activeSlide.catalogBadge ?? activeSlide.categoryName}
                  </motion.div>

                  <motion.h2
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.34, delay: 0.08 }}
                    className="mt-4 line-clamp-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl"
                  >
                    {activeSlide.name}
                  </motion.h2>

                  <motion.p
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.34, delay: 0.12 }}
                    className="mt-3 line-clamp-2 max-w-2xl text-sm leading-relaxed text-foreground/70 sm:text-base"
                  >
                    {activeSlide.shortDescription ?? activeSlide.description ?? 'Promotional storefront feature.'}
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.34, delay: 0.16 }}
                    className="mt-4 flex flex-wrap items-center gap-5 text-sm"
                  >
                    <div className="flex flex-col">
                      <span className="text-[11px] uppercase tracking-[0.16em] text-foreground/55">Price</span>
                      <span className="text-xl font-semibold text-foreground">{formatCurrency(activeSlide.price)}</span>
                    </div>
                    <div className="h-8 w-px bg-black/10" />
                    <div className="flex flex-col">
                      <span className="text-[11px] uppercase tracking-[0.16em] text-foreground/55">Rating</span>
                      <span className="text-xl font-semibold text-foreground">{activeSlide.rating.toFixed(1)}</span>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="hidden shrink-0 lg:flex lg:w-[180px] lg:flex-col lg:items-end lg:justify-center lg:gap-5">
            <Link
              to={`/product/${activeSlide.slug}`}
              className={buttonVariants({
                className:
                  'group h-11 rounded-full bg-black px-6 text-sm font-semibold text-white shadow-md hover:bg-black/85 sm:h-12 sm:px-8 sm:text-base',
              })}
            >
              View product
              <ArrowRightIcon className="ml-2 size-4 transition-transform group-hover:translate-x-1" />
            </Link>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  setDirection(-1)
                  setSelectedIndex((current) => (current - 1 + promoProducts.length) % promoProducts.length)
                }}
                className="size-10 rounded-full border-black/10 bg-white/45 text-foreground backdrop-blur-md hover:bg-white/65 hover:text-foreground"
              >
                <ChevronLeftIcon className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  setDirection(1)
                  setSelectedIndex((current) => (current + 1) % promoProducts.length)
                }}
                className="size-10 rounded-full border-black/10 bg-white/45 text-foreground backdrop-blur-md hover:bg-white/65 hover:text-foreground"
              >
                <ChevronRightIcon className="size-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="relative z-10 mt-5 flex items-center justify-between gap-4 lg:hidden">
          <Link
            to={`/product/${activeSlide.slug}`}
            className={buttonVariants({
              className:
                'group h-11 rounded-full bg-black px-6 text-sm font-semibold text-white shadow-md hover:bg-black/85',
            })}
          >
            View product
            <ArrowRightIcon className="ml-2 size-4 transition-transform group-hover:translate-x-1" />
          </Link>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                setDirection(-1)
                setSelectedIndex((current) => (current - 1 + promoProducts.length) % promoProducts.length)
              }}
              className="size-10 rounded-full border-black/10 bg-white/45 text-foreground backdrop-blur-md hover:bg-white/65 hover:text-foreground"
            >
              <ChevronLeftIcon className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                setDirection(1)
                setSelectedIndex((current) => (current + 1) % promoProducts.length)
              }}
              className="size-10 rounded-full border-black/10 bg-white/45 text-foreground backdrop-blur-md hover:bg-white/65 hover:text-foreground"
            >
              <ChevronRightIcon className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5">
        {promoProducts.map((slide, index) => (
          <div
            key={slide.id}
            className={cn(
              'h-1.5 rounded-full transition-all duration-300',
              index === selectedIndex ? 'w-5 bg-foreground/70' : 'w-1.5 bg-foreground/20',
            )}
          />
        ))}
      </div>
    </section>
  )
}
