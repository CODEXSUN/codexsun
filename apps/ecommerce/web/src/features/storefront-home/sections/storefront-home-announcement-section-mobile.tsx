import type { StorefrontLandingResponse } from "@ecommerce/shared"

import { StorefrontAnnouncementBar } from "../../../components/storefront-announcement-bar"
import { StorefrontTechnicalNameBadge } from "../../../components/storefront-technical-name-badge"

export function StorefrontHomeAnnouncementSectionMobile({
  landing,
}: {
  landing: StorefrontLandingResponse | null
}) {
  return (
    <div
      className="relative"
      data-technical-name="section.storefront.home.announcement"
      data-shell-mode="mobile"
    >
      <StorefrontTechnicalNameBadge
        name="section.storefront.home.announcement"
        className="right-4 top-4"
      />
      <StorefrontAnnouncementBar landing={landing} shellMode="mobile" />
    </div>
  )
}
