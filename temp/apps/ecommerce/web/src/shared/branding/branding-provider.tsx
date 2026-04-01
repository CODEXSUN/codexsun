import type { Company, CompanySummary } from '@shared/index'
import { platformBrandingDefaults } from '@framework-core/web/platform/default-branding'
import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from 'react'
import { getCompany, listCompanies } from '@/shared/api/client'
import { useSetup } from '@/features/setup/components/setup-provider'

type BrandingSnapshot = {
  brandName: string
  legalName: string | null
  tagline: string
  logoUrl: string
  logoDarkUrl: string
  summary: string
  facebookUrl: string | null
  twitterUrl: string | null
  instagramUrl: string | null
  youtubeUrl: string | null
  email: string
  phone: string
  website: string | null
  location: string
}

interface BrandingContextValue extends BrandingSnapshot {
  company: CompanySummary | null
  isLoaded: boolean
}

const sessionStorageKey = 'codexsun.branding'

const defaultBrandingSnapshot: BrandingSnapshot = {
  ...platformBrandingDefaults,
}

const BrandingContext = createContext<BrandingContextValue>({
  ...defaultBrandingSnapshot,
  company: null,
  isLoaded: false,
})

function normalizeText(value: string | null | undefined) {
  const normalized = value?.trim()
  if (!normalized || normalized === '-') {
    return null
  }

  return normalized
}

function formatCompanyLocation(company: Company | CompanySummary | null) {
  if (!company || !('addresses' in company) || !Array.isArray(company.addresses)) {
    return defaultBrandingSnapshot.location
  }

  const primaryAddress =
    company.addresses.find((address) => address.isDefault && address.isActive)
    ?? company.addresses.find((address) => address.isActive)
    ?? null

  if (!primaryAddress) {
    return defaultBrandingSnapshot.location
  }

  return [primaryAddress.addressLine1, primaryAddress.addressLine2]
    .map((value) => normalizeText(value))
    .filter((value): value is string => Boolean(value))
    .join(', ')
}

function findCompanyLogo(
  company: Company | CompanySummary | null,
  matcher: (logoType: string) => boolean,
) {
  if (!company || !('logos' in company) || !Array.isArray(company.logos)) {
    return null
  }

  return company.logos.find((logo) => logo.isActive && matcher(logo.logoType.trim().toLowerCase())) ?? null
}

function resolveBrandLogos(company: Company | CompanySummary | null) {
  const primaryLogo =
    findCompanyLogo(company, (logoType) => ['primary', 'default', 'light', 'logo'].includes(logoType))
    ?? findCompanyLogo(company, (logoType) => !logoType.includes('dark'))
    ?? (company && 'logos' in company && Array.isArray(company.logos)
      ? company.logos.find((logo) => logo.isActive) ?? null
      : null)

  const darkLogo =
    findCompanyLogo(company, (logoType) => ['dark', 'logo-dark', 'primary-dark'].includes(logoType) || logoType.includes('dark'))
    ?? primaryLogo

  return {
    logoUrl: normalizeText(primaryLogo?.logoUrl) ?? defaultBrandingSnapshot.logoUrl,
    logoDarkUrl: normalizeText(darkLogo?.logoUrl) ?? defaultBrandingSnapshot.logoDarkUrl,
  }
}

function createBrandingSnapshot(company: Company | CompanySummary | null): BrandingSnapshot {
  const brandName = normalizeText(company?.name) ?? defaultBrandingSnapshot.brandName
  const legalName = normalizeText(company?.legalName) ?? null
  const tagline = normalizeText(company?.tagline) ?? defaultBrandingSnapshot.tagline
  const description = normalizeText(company?.description)
  const website = normalizeText(company?.website)
  const { logoUrl, logoDarkUrl } = resolveBrandLogos(company)

  return {
    brandName,
    legalName,
    tagline,
    logoUrl,
    logoDarkUrl,
    summary: description ?? defaultBrandingSnapshot.summary,
    facebookUrl: normalizeText(company?.facebookUrl),
    twitterUrl: normalizeText(company?.twitterUrl),
    instagramUrl: normalizeText(company?.instagramUrl),
    youtubeUrl: normalizeText(company?.youtubeUrl),
    email: normalizeText(company?.primaryEmail) ?? defaultBrandingSnapshot.email,
    phone: normalizeText(company?.primaryPhone) ?? defaultBrandingSnapshot.phone,
    website,
    location: formatCompanyLocation(company),
  }
}

function readStoredBranding() {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const rawValue = window.sessionStorage.getItem(sessionStorageKey)
    if (!rawValue) {
      return null
    }

    const parsed = JSON.parse(rawValue) as Partial<BrandingSnapshot>
    if (!parsed || typeof parsed !== 'object' || typeof parsed.brandName !== 'string') {
      return null
    }

    return {
      ...defaultBrandingSnapshot,
      ...parsed,
    } satisfies BrandingSnapshot
  } catch {
    return null
  }
}

function writeStoredBranding(snapshot: BrandingSnapshot) {
  if (typeof window === 'undefined') {
    return
  }

  window.sessionStorage.setItem(sessionStorageKey, JSON.stringify(snapshot))
}

function updateMetaTag(
  selector: string,
  content: string,
  attribute: 'name' | 'property' = 'name',
) {
  if (typeof document === 'undefined') {
    return
  }

  let element = document.head.querySelector<HTMLMetaElement>(selector)

  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, selector.match(/="([^"]+)"/)?.[1] ?? '')
    document.head.appendChild(element)
  }

  element.setAttribute('content', content)
}

function updateCanonicalLink(href: string | null) {
  if (typeof document === 'undefined') {
    return
  }

  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!link) {
    link = document.createElement('link')
    link.setAttribute('rel', 'canonical')
    document.head.appendChild(link)
  }

  if (href) {
    link.setAttribute('href', href)
    return
  }

  link.removeAttribute('href')
}

function syncDocumentMetadata(snapshot: BrandingSnapshot) {
  const title = snapshot.brandName
  const description = snapshot.summary
  const canonicalUrl = snapshot.website ?? (typeof window !== 'undefined' ? window.location.href : null)

  document.title = title

  updateMetaTag('meta[name="application-name"]', snapshot.brandName)
  updateMetaTag('meta[name="description"]', description)
  updateMetaTag('meta[property="og:title"]', title, 'property')
  updateMetaTag('meta[property="og:description"]', description, 'property')
  updateMetaTag('meta[property="og:site_name"]', snapshot.brandName, 'property')
  updateMetaTag('meta[property="og:url"]', canonicalUrl ?? '', 'property')
  updateMetaTag('meta[name="twitter:title"]', title)
  updateMetaTag('meta[name="twitter:description"]', description)
  updateCanonicalLink(canonicalUrl)
}

export function BrandingProvider({ children }: PropsWithChildren) {
  const { status } = useSetup()
  const [snapshot, setSnapshot] = useState<BrandingSnapshot>(() => readStoredBranding() ?? defaultBrandingSnapshot)
  const [company, setCompany] = useState<CompanySummary | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    syncDocumentMetadata(snapshot)
  }, [snapshot])

  useEffect(() => {
    if (status?.status !== 'ready') {
      return
    }

    let cancelled = false

    void (async () => {
      try {
        const companies = await listCompanies()
        if (cancelled) {
          return
        }

        const activeCompany = companies.find((item) => item.isActive) ?? companies[0] ?? null
        const detailedCompany = activeCompany ? await getCompany(activeCompany.id) : null
        const nextSnapshot = createBrandingSnapshot(detailedCompany ?? activeCompany)

        setCompany(detailedCompany ?? activeCompany)
        setSnapshot(nextSnapshot)
        setIsLoaded(true)
        writeStoredBranding(nextSnapshot)
      } catch {
        if (!cancelled) {
          setIsLoaded(true)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [status?.status])

  return (
    <BrandingContext.Provider
      value={{
        ...snapshot,
        company,
        isLoaded,
      }}
    >
      {children}
    </BrandingContext.Provider>
  )
}

export function useBranding() {
  return useContext(BrandingContext)
}
