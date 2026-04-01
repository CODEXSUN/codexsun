import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'

const frameworkBillingPrefix = '/admin/dashboard/billing'

function normalizeBillingTarget(target: string) {
  if (!target) {
    return '/'
  }

  return target.startsWith('/') ? target : `/${target}`
}

export function resolveBillingHref(currentPathname: string, target: string) {
  const normalizedTarget = normalizeBillingTarget(target)

  if (currentPathname === frameworkBillingPrefix || currentPathname.startsWith(`${frameworkBillingPrefix}/`)) {
    return normalizedTarget === '/'
      ? frameworkBillingPrefix
      : `${frameworkBillingPrefix}${normalizedTarget}`
  }

  return normalizedTarget
}

export function useBillingHref(target: string) {
  const location = useLocation()

  return useMemo(
    () => resolveBillingHref(location.pathname, target),
    [location.pathname, target],
  )
}

export function useBillingRouteBuilder() {
  const location = useLocation()

  return useMemo(
    () => (target: string) => resolveBillingHref(location.pathname, target),
    [location.pathname],
  )
}
