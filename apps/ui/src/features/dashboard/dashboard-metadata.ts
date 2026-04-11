export function formatDashboardDocumentTitle({
  brandName,
  pageTitle,
}: {
  brandName: string
  pageTitle: string
}) {
  const normalizedBrandName = brandName.trim()
  const normalizedPageTitle = pageTitle.trim()

  if (!normalizedPageTitle || normalizedPageTitle === normalizedBrandName) {
    return normalizedBrandName
  }

  return `${normalizedPageTitle} | ${normalizedBrandName}`
}
