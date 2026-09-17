import { useLayoutEffect, useRef, useState, type UIEventHandler } from 'react'

export function usePersistentOpenState(storageKey: string | undefined, defaultOpen: boolean) {
  const [open, setOpenState] = useState(() => readBoolean(storageKey) ?? defaultOpen)

  const setOpen = (nextOpen: boolean) => {
    setOpenState(nextOpen)
    writeValue(storageKey, String(nextOpen))
  }

  return [open, setOpen] as const
}

export function usePersistentScrollPosition(storageKey: string | undefined) {
  const ref = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const scrollTop = readNumber(storageKey)
    if (ref.current && scrollTop !== undefined) ref.current.scrollTop = scrollTop
  }, [storageKey])

  const onScroll: UIEventHandler<HTMLDivElement> = (event) => {
    writeValue(storageKey, String(event.currentTarget.scrollTop))
  }

  return { onScroll, ref }
}

function readBoolean(storageKey: string | undefined) {
  const value = readValue(storageKey)
  if (value === 'true') return true
  if (value === 'false') return false
  return undefined
}

function readNumber(storageKey: string | undefined) {
  const value = readValue(storageKey)
  if (value === undefined) return undefined
  const number = Number(value)
  return Number.isFinite(number) ? number : undefined
}

function readValue(storageKey: string | undefined) {
  if (!storageKey || typeof window === 'undefined') return undefined
  try {
    return window.sessionStorage.getItem(storageKey) ?? undefined
  } catch {
    return undefined
  }
}

function writeValue(storageKey: string | undefined, value: string) {
  if (!storageKey || typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(storageKey, value)
  } catch {
    // Keep navigation usable when browser storage is unavailable.
  }
}
