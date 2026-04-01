import { customAppArchitecture } from '@custom-domain/manifest'
import { PageSection } from '@/shared/ui/page-section'
import { PackageGrid } from '../components/package-grid'
import type { PackageGroup } from '../model/package-group'

const packageGroups: PackageGroup[] = [
  {
    title: 'Runtime packages',
    items: customAppArchitecture.packagesNeeded.filter((item) => item.kind === 'runtime'),
  },
  {
    title: 'Dev packages',
    items: customAppArchitecture.packagesNeeded.filter((item) => item.kind === 'dev'),
  },
]

export function PackagesPage() {
  return (
    <div className="space-y-10">
      <PageSection
        eyebrow="Package list"
        title="Use the existing workspace toolchain and add nothing extra"
        description="This scaffold reuses the current root dependencies. No new package was added for the custom app setup."
      >
        <PackageGrid groups={packageGroups} />
      </PageSection>
    </div>
  )
}
