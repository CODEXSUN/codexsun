import { Contact, Mail, MessageCircle, Phone } from 'lucide-react'
import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import { useBranding } from '@/shared/branding/branding-provider'

type ContactInfo = {
  email: string
  phone: string
}

type FloatingContactButtonProps = {
  floating?: {
    email?: string
    phone?: string
  }
  className?: string
}

function toPhoneDigits(value: string): string {
  return value.replace(/\D/g, '')
}

export function FloatingContactButton({ floating, className }: FloatingContactButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const branding = useBranding()

  const contact = useMemo(() => {
    const base: ContactInfo = {
      email: branding.email,
      phone: branding.phone,
    }

    return {
      email: floating?.email ?? base.email,
      phone: floating?.phone ?? base.phone,
    }
  }, [branding.email, branding.phone, floating?.email, floating?.phone])

  const phoneDigits = useMemo(() => toPhoneDigits(contact.phone), [contact.phone])

  return (
    <div className={cn('fixed bottom-6 right-6 z-[70] flex flex-col items-end gap-3', className)}>
      {isOpen ? (
        <div className="flex flex-col items-end gap-2">
          <a
            href={`https://wa.me/${phoneDigits}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex cursor-pointer items-center gap-2 rounded-full border border-emerald-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-800 shadow-lg ring-1 ring-emerald-100 transition hover:-translate-y-0.5 hover:bg-slate-50"
            aria-label={`WhatsApp ${contact.phone}`}
          >
            <MessageCircle className="h-4 w-4 text-green-600" />
            <span>WhatsApp {contact.phone}</span>
          </a>

          <a
            href={`tel:${phoneDigits}`}
            className="flex cursor-pointer items-center gap-2 rounded-full border border-sky-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-800 shadow-lg ring-1 ring-sky-100 transition hover:-translate-y-0.5 hover:bg-slate-50"
            aria-label={`Call ${contact.phone}`}
          >
            <Phone className="h-4 w-4 text-sky-600" />
            <span>Phone {contact.phone}</span>
          </a>

          <a
            href={`mailto:${contact.email}`}
            className="flex cursor-pointer items-center gap-2 rounded-full border border-blue-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-800 shadow-lg ring-1 ring-blue-100 transition hover:-translate-y-0.5 hover:bg-slate-50"
            aria-label={`Email ${contact.email}`}
          >
            <Mail className="h-4 w-4 text-blue-600" />
            <span>Mail {contact.email}</span>
          </a>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        className="group relative flex h-16 w-16 cursor-pointer items-center justify-center rounded-full border border-white/35 bg-[#007BFF] text-white shadow-xl transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#005FCC]"
        aria-label={isOpen ? 'Close contact actions' : 'Open contact actions'}
      >
        <span className="pointer-events-none absolute inset-1 rounded-full border border-white/30" />
        <span className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-white/20" />
        <Contact className="relative z-10 h-7 w-7 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6" />
      </button>
    </div>
  )
}

export default FloatingContactButton
