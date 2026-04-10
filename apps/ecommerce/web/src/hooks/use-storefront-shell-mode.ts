import { useEffect, useState } from "react"

const storefrontMobileShellMediaQuery = "(max-width: 1023px)"

function getIsStorefrontMobileShell() {
  if (typeof window === "undefined") {
    return false
  }

  return window.matchMedia(storefrontMobileShellMediaQuery).matches
}

export function useStorefrontIsMobileShell() {
  const [isMobile, setIsMobile] = useState(getIsStorefrontMobileShell)

  useEffect(() => {
    const mediaQuery = window.matchMedia(storefrontMobileShellMediaQuery)
    const sync = () => {
      setIsMobile(mediaQuery.matches)
    }

    sync()
    mediaQuery.addEventListener("change", sync)

    return () => {
      mediaQuery.removeEventListener("change", sync)
    }
  }, [])

  return isMobile
}
