import { Contact, Mail, MessageCircle, Phone } from "lucide-react"
import { useMemo, useState } from "react"

import { useRuntimeBrand } from "@/features/branding/runtime-brand-provider"
import { cn } from "@/lib/utils"

type FloatingContactButtonProps = {
  contact?: {
    email?: string | null
    phone?: string | null
  }
  config?: {
    enabled?: boolean
    icon?: "contact" | "message" | "phone" | "mail"
    email?: string | null
    phone?: string | null
    showWhatsApp?: boolean
    showPhone?: boolean
    showEmail?: boolean
    buttonLabel?: string
    whatsappLabel?: string
    phoneLabel?: string
    emailLabel?: string
    whatsappMessage?: string
    buttonBackgroundColor?: string
    buttonHoverBackgroundColor?: string
    buttonTextColor?: string
    buttonBorderColor?: string
    buttonRingColor?: string
    actionBackgroundColor?: string
    actionBorderColor?: string
    actionTextColor?: string
    actionIconColor?: string
  }
  className?: string
}

function toPhoneDigits(value: string) {
  return value.replace(/\D/g, "")
}

export function FloatingContactButton({
  contact,
  config,
  className,
}: FloatingContactButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { brand } = useRuntimeBrand()

  const resolvedContact = useMemo(
    () => ({
      email: contact?.email ?? brand?.primaryEmail ?? "",
      phone: contact?.phone ?? brand?.primaryPhone ?? "",
    }),
    [brand?.primaryEmail, brand?.primaryPhone, contact?.email, contact?.phone]
  )

  const resolvedEmail = config?.email?.trim() || resolvedContact.email
  const resolvedPhone = config?.phone?.trim() || resolvedContact.phone
  const resolvedPhoneDigits = toPhoneDigits(resolvedPhone)
  const hasPhone = resolvedPhoneDigits.length > 0
  const hasEmail = resolvedEmail.trim().length > 0
  const showWhatsApp = (config?.showWhatsApp ?? true) && hasPhone
  const showPhone = (config?.showPhone ?? true) && hasPhone
  const showEmail = (config?.showEmail ?? true) && hasEmail
  const FabIcon =
    config?.icon === "mail"
      ? Mail
      : config?.icon === "phone"
        ? Phone
        : config?.icon === "message"
          ? MessageCircle
          : Contact

  if (config?.enabled === false || (!showWhatsApp && !showPhone && !showEmail)) {
    return null
  }

  return (
    <div
      className={cn(
        "fixed bottom-20 right-4 z-40 flex flex-col items-end gap-3 sm:bottom-24 sm:right-5 lg:bottom-20 lg:right-6",
        className
      )}
    >
      {isOpen ? (
        <div className="flex flex-col items-end gap-2">
          {showWhatsApp ? (
            <a
              href={`https://wa.me/${resolvedPhoneDigits}?text=${encodeURIComponent(config?.whatsappMessage?.trim() || "Hello")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-medium shadow-lg transition hover:-translate-y-0.5"
              aria-label={`WhatsApp ${resolvedPhone}`}
              style={{
                background: config?.actionBackgroundColor ?? "#ffffff",
                borderColor: config?.actionBorderColor ?? "#bbf7d0",
                color: config?.actionTextColor ?? "#0f172a",
              }}
            >
              <MessageCircle
                className="h-4 w-4"
                style={{ color: config?.actionIconColor ?? "#16a34a" }}
              />
              <span>{config?.whatsappLabel ?? "WhatsApp"} {resolvedPhone}</span>
            </a>
          ) : null}

          {showPhone ? (
            <a
              href={`tel:${resolvedPhoneDigits}`}
              className="flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-medium shadow-lg transition hover:-translate-y-0.5"
              aria-label={`Call ${resolvedPhone}`}
              style={{
                background: config?.actionBackgroundColor ?? "#ffffff",
                borderColor: config?.actionBorderColor ?? "#bfdbfe",
                color: config?.actionTextColor ?? "#0f172a",
              }}
            >
              <Phone
                className="h-4 w-4"
                style={{ color: config?.actionIconColor ?? "#2563eb" }}
              />
              <span>{config?.phoneLabel ?? "Phone"} {resolvedPhone}</span>
            </a>
          ) : null}

          {showEmail ? (
            <a
              href={`mailto:${resolvedEmail}`}
              className="flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-medium shadow-lg transition hover:-translate-y-0.5"
              aria-label={`Email ${resolvedEmail}`}
              style={{
                background: config?.actionBackgroundColor ?? "#ffffff",
                borderColor: config?.actionBorderColor ?? "#bfdbfe",
                color: config?.actionTextColor ?? "#0f172a",
              }}
            >
              <Mail
                className="h-4 w-4"
                style={{ color: config?.actionIconColor ?? "#2563eb" }}
              />
              <span>{config?.emailLabel ?? "Mail"} {resolvedEmail}</span>
            </a>
          ) : null}
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        className="group relative flex h-16 w-16 items-center justify-center rounded-full border text-white shadow-xl transition-all duration-200 hover:-translate-y-0.5"
        aria-label={isOpen ? "Close contact actions" : "Open contact actions"}
        title={config?.buttonLabel ?? "Contact us"}
        style={{
          background: config?.buttonBackgroundColor ?? "#007BFF",
          color: config?.buttonTextColor ?? "#ffffff",
          borderColor: config?.buttonBorderColor ?? "#ffffff59",
        }}
      >
        <span
          className="pointer-events-none absolute inset-1 rounded-full border"
          style={{ borderColor: config?.buttonBorderColor ?? "#ffffff4d" }}
        />
        <span
          className="pointer-events-none absolute inset-0 rounded-full ring-1"
          style={{ color: config?.buttonRingColor ?? "#ffffff33" }}
        />
        <FabIcon className="relative z-10 h-7 w-7 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6" />
      </button>
    </div>
  )
}
