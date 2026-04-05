"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useState,
  type ReactNode,
} from "react"

import { GlobalLoader } from "@/registry/concerns/feedback/global-loader"

type GlobalLoadingContextValue = {
  activeCount: number
  setLoading: (id: string, active: boolean) => void
}

const GlobalLoadingContext = createContext<GlobalLoadingContextValue | null>(null)

export function GlobalLoadingProvider({ children }: { children: ReactNode }) {
  const [activeLoaders, setActiveLoaders] = useState<Record<string, boolean>>({})
  const setLoading = useCallback((id: string, active: boolean) => {
    setActiveLoaders((current) => {
      if (active) {
        if (current[id]) {
          return current
        }

        return {
          ...current,
          [id]: true,
        }
      }

      if (!current[id]) {
        return current
      }

      const next = { ...current }
      delete next[id]
      return next
    })
  }, [])
  const activeCount = Object.keys(activeLoaders).length

  const value = useMemo<GlobalLoadingContextValue>(
    () => ({
      activeCount,
      setLoading,
    }),
    [activeCount, setLoading]
  )

  return (
    <GlobalLoadingContext.Provider value={value}>
      {children}
      {value.activeCount > 0 ? (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-background/48 backdrop-blur-sm">
          <GlobalLoader size="md" className="min-h-0 p-0" />
        </div>
      ) : null}
    </GlobalLoadingContext.Provider>
  )
}

export function useGlobalLoading(active: boolean) {
  const context = useContext(GlobalLoadingContext)
  const id = useId()
  const setLoading = context?.setLoading

  useEffect(() => {
    if (!setLoading) {
      return
    }

    setLoading(id, active)

    return () => {
      setLoading(id, false)
    }
  }, [active, id, setLoading])
}
