import type { ComponentType, SVGProps } from "react"

import {
  ChatBubbleIcon,
  DiscordLogoIcon,
  GitHubLogoIcon,
  GlobeIcon,
  InstagramLogoIcon,
  LinkedInLogoIcon,
  PaperPlaneIcon,
} from "@radix-ui/react-icons"
import { Play } from "lucide-react"

import type { StorefrontFooterSocialLink } from "@ecommerce/shared"

type SocialIconComponent = ComponentType<{ className?: string }>

function FacebookIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M15 3h-2a4 4 0 0 0-4 4v3H7v4h2v7h4v-7h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  )
}

function XIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M4 4l16 16" />
      <path d="M20 4L4 20" />
    </svg>
  )
}

export const FOOTER_SOCIAL_PLATFORM_OPTIONS: Array<{
  label: string
  platform: StorefrontFooterSocialLink["platform"]
}> = [
  { label: "Website", platform: "website" },
  { label: "Facebook", platform: "facebook" },
  { label: "Instagram", platform: "instagram" },
  { label: "X", platform: "twitter" },
  { label: "YouTube", platform: "youtube" },
  { label: "LinkedIn", platform: "linkedin" },
  { label: "GitHub", platform: "github" },
  { label: "Discord", platform: "discord" },
  { label: "WhatsApp", platform: "whatsapp" },
  { label: "Telegram", platform: "telegram" },
]

export function getFooterSocialPlatformLabel(platform: StorefrontFooterSocialLink["platform"]) {
  return FOOTER_SOCIAL_PLATFORM_OPTIONS.find((item) => item.platform === platform)?.label ?? "Website"
}

export function getFooterSocialPlatformIcon(platform: StorefrontFooterSocialLink["platform"]): SocialIconComponent {
  switch (platform) {
    case "facebook":
      return FacebookIcon
    case "instagram":
      return InstagramLogoIcon
    case "twitter":
      return XIcon
    case "youtube":
      return Play
    case "linkedin":
      return LinkedInLogoIcon
    case "github":
      return GitHubLogoIcon
    case "discord":
      return DiscordLogoIcon
    case "whatsapp":
      return ChatBubbleIcon
    case "telegram":
      return PaperPlaneIcon
    default:
      return GlobeIcon
  }
}
