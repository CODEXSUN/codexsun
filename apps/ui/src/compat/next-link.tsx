import * as React from "react"
import { Link as RouterLink } from "react-router-dom"

type NextLinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string
  children: React.ReactNode
  legacyBehavior?: boolean
  passHref?: boolean
}

const isExternalHref = (href: string) =>
  href.startsWith("http://") ||
  href.startsWith("https://") ||
  href.startsWith("mailto:") ||
  href.startsWith("tel:")

const Link = React.forwardRef<HTMLAnchorElement, NextLinkProps>(
  (
    { href, children, legacyBehavior, passHref, ...props },
    ref,
  ) => {
    void passHref

    if (legacyBehavior && React.isValidElement(children)) {
      const child =
        children as React.ReactElement<React.AnchorHTMLAttributes<HTMLAnchorElement>>

      return React.cloneElement(child, {
        ...props,
        ...child.props,
        href,
      })
    }

    if (isExternalHref(href)) {
      return (
        <a ref={ref} href={href} {...props}>
          {children}
        </a>
      )
    }

    return (
      <RouterLink ref={ref} to={href} {...props}>
        {children}
      </RouterLink>
    )
  },
)

Link.displayName = "NextLinkCompat"

export default Link
