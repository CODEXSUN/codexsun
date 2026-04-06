import * as React from "react"

import { cn } from "@/lib/utils"

const DockContext = React.createContext<{ mouseX: number | null }>({
  mouseX: null,
})

export function Dock({
  children,
  className,
  direction = "middle",
}: {
  children: React.ReactNode
  className?: string
  direction?: "left" | "middle" | "right"
}) {
  const [mouseX, setMouseX] = React.useState<number | null>(null)

  return (
    <DockContext.Provider value={{ mouseX }}>
      <div
        className={cn(
          "flex w-full items-end gap-1 rounded-[1.65rem] border border-[#eadfd2] bg-white/92 p-2 shadow-[0_-18px_38px_-28px_rgba(34,22,13,0.28)]",
          direction === "left"
            ? "justify-start"
            : direction === "right"
              ? "justify-end"
              : "justify-center",
          className
        )}
        onMouseMove={(event) => setMouseX(event.clientX)}
        onMouseLeave={() => setMouseX(null)}
      >
        {children}
      </div>
    </DockContext.Provider>
  )
}

export function DockIcon({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const { mouseX } = React.useContext(DockContext)
  const ref = React.useRef<HTMLDivElement | null>(null)

  let scale = 1
  let translateY = 0

  if (mouseX !== null && ref.current) {
    const bounds = ref.current.getBoundingClientRect()
    const centerX = bounds.left + bounds.width / 2
    const distance = Math.abs(mouseX - centerX)
    const influence = Math.max(0, 1 - distance / 120)

    scale = 1 + influence * 0.14
    translateY = influence * -4
  }

  return (
    <div
      ref={ref}
      className={cn("flex items-end justify-center transition-transform duration-150", className)}
      style={{ transform: `translateY(${translateY}px) scale(${scale})` }}
    >
      {children}
    </div>
  )
}
