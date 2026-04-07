import { useEffect, useRef, useState } from "react"

export function useHorizontalRailControls(itemCount: number) {
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const [showLeftChevron, setShowLeftChevron] = useState(false)
  const [showRightChevron, setShowRightChevron] = useState(false)

  useEffect(() => {
    const container = scrollRef.current

    if (!container) {
      return
    }

    const updateChevron = () => {
      setShowLeftChevron(container.scrollLeft > 16)
      const remaining = container.scrollWidth - container.clientWidth - container.scrollLeft
      setShowRightChevron(remaining > 16)
    }

    updateChevron()
    container.addEventListener("scroll", updateChevron, { passive: true })
    window.addEventListener("resize", updateChevron)

    return () => {
      container.removeEventListener("scroll", updateChevron)
      window.removeEventListener("resize", updateChevron)
    }
  }, [itemCount])

  return {
    scrollRef,
    showLeftChevron,
    showRightChevron,
    scrollLeft: () => scrollRef.current?.scrollBy({ left: -360, behavior: "smooth" }),
    scrollRight: () => scrollRef.current?.scrollBy({ left: 360, behavior: "smooth" }),
  }
}
