import { useEffect, useRef, useState, type ComponentProps } from 'react'

import { Spinner } from '@codexsun/ui/components/spinner'
import { cn } from '@codexsun/ui/lib/utils'

type GlobalLoaderProps = ComponentProps<'div'> & {
  active: boolean
  delayMs?: number
  label?: string
  minimumDurationMs?: number
  overlay?: boolean
}

const FADE_DURATION_MS = 160

export function GlobalLoader({
  active,
  className,
  delayMs = 120,
  label = 'Loading',
  minimumDurationMs = 220,
  overlay = false,
  ...props
}: GlobalLoaderProps) {
  const { mounted, visible } = useLoaderPresence(active, delayMs, minimumDurationMs)

  if (!mounted) {
    return null
  }

  return (
    <div
      aria-busy={active}
      aria-hidden={!visible}
      aria-live="polite"
      data-slot="global-loader"
      role="status"
      className={cn(
        'flex min-h-full items-center justify-center gap-3 bg-background px-6 text-sm text-muted-foreground transition-opacity duration-150 ease-out',
        overlay && 'absolute inset-0 z-10',
        visible ? 'opacity-100' : 'pointer-events-none opacity-0',
        className,
      )}
      {...props}
    >
      <Spinner className="size-5 text-foreground" />
      <span>{label}</span>
    </div>
  )
}

function useLoaderPresence(active: boolean, delayMs: number, minimumDurationMs: number) {
  const [mounted, setMounted] = useState(active && delayMs === 0)
  const [visible, setVisible] = useState(active && delayMs === 0)
  const shownAt = useRef<number | undefined>(undefined)

  useEffect(() => {
    let hideTimer: ReturnType<typeof setTimeout> | undefined
    let showTimer: ReturnType<typeof setTimeout> | undefined
    let unmountTimer: ReturnType<typeof setTimeout> | undefined

    if (active && !mounted) {
      showTimer = setTimeout(() => {
        shownAt.current = Date.now()
        setMounted(true)
        setVisible(true)
      }, delayMs)
    } else if (active) {
      shownAt.current ??= Date.now()
      setVisible(true)
    } else if (mounted) {
      const elapsed = shownAt.current ? Date.now() - shownAt.current : minimumDurationMs
      hideTimer = setTimeout(
        () => {
          setVisible(false)
          unmountTimer = setTimeout(() => setMounted(false), FADE_DURATION_MS)
        },
        Math.max(0, minimumDurationMs - elapsed),
      )
    }

    return () => {
      clearTimeout(hideTimer)
      clearTimeout(showTimer)
      clearTimeout(unmountTimer)
    }
  }, [active, delayMs, minimumDurationMs, mounted])

  return { mounted, visible }
}
