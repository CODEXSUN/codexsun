import { startTransition, useEffect, useRef, useState, type ReactNode } from "react"

export function StorefrontDeferredSection({
  children,
  fallback = null,
  rootMargin = "320px 0px",
  minHeightClassName = "min-h-[160px]",
}: {
  children: ReactNode
  fallback?: ReactNode
  rootMargin?: string
  minHeightClassName?: string
}) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const node = containerRef.current

    if (!node || isVisible) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) {
          return
        }

        startTransition(() => {
          setIsVisible(true)
        })
        observer.disconnect()
      },
      { rootMargin }
    )

    observer.observe(node)

    return () => {
      observer.disconnect()
    }
  }, [isVisible, rootMargin])

  return (
    <div
      ref={containerRef}
      className={`min-w-0 max-w-full overflow-x-clip ${isVisible ? "" : minHeightClassName}`}
    >
      {isVisible ? children : fallback}
    </div>
  )
}
