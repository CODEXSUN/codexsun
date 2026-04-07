import { useEffect, useRef } from "react"
import { useLocation } from "react-router-dom"

import { normalizeStorefrontCanonicalPath } from "@ecommerce/shared"
import {
  formatStorefrontDocumentTitle,
  resolveStorefrontRouteMetadata,
} from "../lib/storefront-metadata"
import { storefrontFrontendTarget } from "../lib/storefront-routes"

function ensureMetaDescriptionTag() {
  let element = document.querySelector('meta[name="description"]')

  if (!element) {
    element = document.createElement("meta")
    element.setAttribute("name", "description")
    document.head.appendChild(element)
  }

  return element
}

function ensureManagedMetaTag(attribute: "name" | "property", key: string) {
  let element = document.head.querySelector<HTMLMetaElement>(
    `meta[data-storefront-meta="true"][${attribute}="${key}"]`
  )

  if (!element) {
    element = document.createElement("meta")
    element.setAttribute(attribute, key)
    element.setAttribute("data-storefront-meta", "true")
    document.head.appendChild(element)
  }

  return element
}

function ensureManagedLinkTag(rel: string) {
  let element = document.head.querySelector<HTMLLinkElement>(
    `link[data-storefront-meta="true"][rel="${rel}"]`
  )

  if (!element) {
    element = document.createElement("link")
    element.setAttribute("rel", rel)
    element.setAttribute("data-storefront-meta", "true")
    document.head.appendChild(element)
  }

  return element
}

function clearManagedStorefrontTags() {
  document.head
    .querySelectorAll('[data-storefront-meta="true"]')
    .forEach((node) => node.remove())
}

export function StorefrontRouteMetadata() {
  const location = useLocation()
  const initialTitleRef = useRef<string | null>(null)
  const initialDescriptionRef = useRef<string | null>(null)
  const initialRobotsRef = useRef<string | null>(null)

  useEffect(() => {
    if (typeof document === "undefined") {
      return
    }

    if (initialTitleRef.current === null) {
      initialTitleRef.current = document.title
    }

    const descriptionTag = ensureMetaDescriptionTag()

    if (initialDescriptionRef.current === null) {
      initialDescriptionRef.current = descriptionTag.getAttribute("content")
    }

    if (initialRobotsRef.current === null) {
      initialRobotsRef.current =
        document.querySelector<HTMLMetaElement>('meta[name="robots"]')?.getAttribute("content") ??
        null
    }

    const metadata = resolveStorefrontRouteMetadata(location.pathname)

    if (!metadata) {
      clearManagedStorefrontTags()

      if (initialTitleRef.current) {
        document.title = initialTitleRef.current
      }

      if (initialDescriptionRef.current !== null) {
        descriptionTag.setAttribute("content", initialDescriptionRef.current)
      }

      if (initialRobotsRef.current !== null) {
        let robotsTag = document.querySelector<HTMLMetaElement>('meta[name="robots"]')

        if (!robotsTag) {
          robotsTag = document.createElement("meta")
          robotsTag.setAttribute("name", "robots")
          document.head.appendChild(robotsTag)
        }

        robotsTag.setAttribute("content", initialRobotsRef.current)
      }

      return
    }

    const canonicalPath = normalizeStorefrontCanonicalPath(
      location.pathname,
      storefrontFrontendTarget
    )
    const canonicalUrl = `${window.location.origin}${canonicalPath}`
    const openGraphImageUrl = `${window.location.origin}${metadata.openGraphImagePath}`

    document.title = formatStorefrontDocumentTitle(metadata)
    descriptionTag.setAttribute("content", metadata.description)
    ensureManagedMetaTag("name", "robots").setAttribute("content", metadata.robots)
    ensureManagedLinkTag("canonical").setAttribute("href", canonicalUrl)
    ensureManagedMetaTag("property", "og:title").setAttribute(
      "content",
      formatStorefrontDocumentTitle(metadata)
    )
    ensureManagedMetaTag("property", "og:description").setAttribute(
      "content",
      metadata.description
    )
    ensureManagedMetaTag("property", "og:url").setAttribute("content", canonicalUrl)
    ensureManagedMetaTag("property", "og:type").setAttribute("content", "website")
    ensureManagedMetaTag("property", "og:image").setAttribute(
      "content",
      openGraphImageUrl
    )
    ensureManagedMetaTag("property", "og:site_name").setAttribute(
      "content",
      "Tirupur Direct"
    )
  }, [location.pathname])

  return null
}
