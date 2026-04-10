import { useStorefrontIsMobileShell } from "../../../hooks/use-storefront-shell-mode"

import { StorefrontHomeAnnouncementSectionDesktop } from "./storefront-home-announcement-section-desktop"
import { StorefrontHomeAnnouncementSectionMobile } from "./storefront-home-announcement-section-mobile"

export function StorefrontHomeAnnouncementSection({
  landing,
}: {
  landing: Parameters<typeof StorefrontHomeAnnouncementSectionDesktop>[0]["landing"]
}) {
  const isMobileShell = useStorefrontIsMobileShell()

  if (isMobileShell) {
    return <StorefrontHomeAnnouncementSectionMobile landing={landing} />
  }

  return <StorefrontHomeAnnouncementSectionDesktop landing={landing} />
}
