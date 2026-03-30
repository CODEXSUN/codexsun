import * as React from "react"
import { AnimatePresence, motion } from "motion/react"

import { cn } from "@/lib/utils"

type AnimatedTabDirection = -1 | 0 | 1

export type AnimatedTab = {
  label: string
  value: string
  subRoutes?: string[]
  className?: string
}

export type AnimatedContentTab = AnimatedTab & {
  content: React.ReactNode
  contentClassName?: string
}

type AnimatedTabsProps = {
  tabs: AnimatedContentTab[]
  defaultTabValue?: string
  selectedTabValue?: string
  onTabChange?: (value: string) => void
}

const transition = {
  duration: 0.16,
  ease: "easeOut" as const,
  type: "tween" as const,
}

function resolveInitialIndex(tabs: AnimatedContentTab[], value?: string) {
  if (!value) {
    return 0
  }

  const index = tabs.findIndex((tab) => tab.value === value)
  return index === -1 ? 0 : index
}

function TabContent({
  direction,
  tab,
}: {
  direction: AnimatedTabDirection
  tab: AnimatedContentTab
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: direction >= 0 ? 14 : -14, y: 8 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      exit={{ opacity: 0, x: direction >= 0 ? -14 : 14, y: -8 }}
      transition={transition}
      className={cn(
        "mt-4 rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm md:p-5",
        tab.contentClassName
      )}
    >
      {tab.content}
    </motion.div>
  )
}

export function AnimatedTabs({
  tabs,
  defaultTabValue,
  selectedTabValue,
  onTabChange,
}: AnimatedTabsProps) {
  const initialIndex = React.useMemo(
    () => resolveInitialIndex(tabs, selectedTabValue ?? defaultTabValue),
    [defaultTabValue, selectedTabValue, tabs]
  )
  const [activeIndex, setActiveIndex] = React.useState(initialIndex)
  const [direction, setDirection] = React.useState<AnimatedTabDirection>(0)
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null)
  const [indicatorStyle, setIndicatorStyle] = React.useState<{
    width: number
    x: number
  } | null>(null)
  const [hoverStyle, setHoverStyle] = React.useState<{
    width: number
    x: number
  } | null>(null)
  const navRef = React.useRef<HTMLDivElement>(null)
  const buttonRefs = React.useRef<Array<HTMLButtonElement | null>>([])

  React.useEffect(() => {
    if (!selectedTabValue) {
      return
    }

    const nextIndex = resolveInitialIndex(tabs, selectedTabValue)
    setDirection(nextIndex > activeIndex ? 1 : -1)
    setActiveIndex(nextIndex)
  }, [activeIndex, selectedTabValue, tabs])

  React.useLayoutEffect(() => {
    const navRect = navRef.current?.getBoundingClientRect()
    const activeRect = buttonRefs.current[activeIndex]?.getBoundingClientRect()
    const hoveredRect =
      hoveredIndex == null
        ? null
        : buttonRefs.current[hoveredIndex]?.getBoundingClientRect()

    if (navRect && activeRect) {
      setIndicatorStyle({
        width: activeRect.width,
        x: activeRect.left - navRect.left,
      })
    } else {
      setIndicatorStyle(null)
    }

    if (navRect && hoveredRect) {
      setHoverStyle({
        width: hoveredRect.width,
        x: hoveredRect.left - navRect.left,
      })
    } else {
      setHoverStyle(null)
    }
  }, [activeIndex, hoveredIndex, tabs])

  const activeTab = tabs[activeIndex] ?? tabs[0]

  if (!activeTab) {
    return null
  }

  return (
    <div className="w-full">
      <div className="rounded-2xl border border-border/70 bg-card/60 p-1 shadow-sm">
        <div
          ref={navRef}
          className="relative flex items-center gap-1 overflow-x-auto"
          onPointerLeave={() => setHoveredIndex(null)}
        >
          <AnimatePresence>
            {hoverStyle ? (
              <motion.div
                key="hover"
                className="absolute inset-y-0 z-0 rounded-xl bg-muted/80"
                initial={{ opacity: 0, width: hoverStyle.width, x: hoverStyle.x }}
                animate={{ opacity: 1, width: hoverStyle.width, x: hoverStyle.x }}
                exit={{ opacity: 0, width: hoverStyle.width, x: hoverStyle.x }}
                transition={transition}
              />
            ) : null}
          </AnimatePresence>
          {indicatorStyle ? (
            <motion.div
              className="absolute bottom-0 z-10 h-0.5 rounded-full bg-foreground"
              initial={false}
              animate={{
                width: indicatorStyle.width - 18,
                x: indicatorStyle.x + 9,
              }}
              transition={transition}
            />
          ) : null}
          {tabs.map((tab, index) => {
            const isActive = index === activeIndex

            return (
              <button
                key={tab.value}
                ref={(node) => {
                  buttonRefs.current[index] = node
                }}
                type="button"
                className={cn(
                  "relative z-20 flex min-h-10 shrink-0 items-center rounded-xl px-4 py-2 text-sm transition-colors",
                  isActive
                    ? "font-semibold text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                  tab.className
                )}
                onPointerEnter={() => setHoveredIndex(index)}
                onFocus={() => setHoveredIndex(index)}
                onClick={() => {
                  if (index === activeIndex) {
                    return
                  }

                  setDirection(index > activeIndex ? 1 : -1)
                  setActiveIndex(index)
                  onTabChange?.(tab.value)
                }}
              >
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <TabContent key={activeTab.value} direction={direction} tab={activeTab} />
      </AnimatePresence>
    </div>
  )
}
