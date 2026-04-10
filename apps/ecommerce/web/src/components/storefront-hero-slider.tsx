import type { StorefrontLandingResponse } from "@ecommerce/shared"

import { useStorefrontIsMobileShell } from "../hooks/use-storefront-shell-mode"
import { StorefrontHeroSliderDesktop } from "./storefront-hero-slider-desktop"
import { StorefrontHeroSliderMobile } from "./storefront-hero-slider-mobile"

export function StorefrontHeroSlider({ landing }: { landing: StorefrontLandingResponse }) {
  const isMobileShell = useStorefrontIsMobileShell()

  if (isMobileShell) {
    return <StorefrontHeroSliderMobile landing={landing} />
  }

  return <StorefrontHeroSliderDesktop landing={landing} />
}
