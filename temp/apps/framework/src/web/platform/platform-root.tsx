import { Suspense } from 'react'
import { PlatformFallbackScreen } from './platform-fallback-screen'
import { resolveFrontendApplication } from './application-registry'

export function PlatformRoot() {
  const application = resolveFrontendApplication()
  const ApplicationShellRoot = application.Root

  return (
    <div data-platform-app={application.id} data-platform-app-name={application.name}>
      <Suspense fallback={<PlatformFallbackScreen shellName={application.name} />}>
        <ApplicationShellRoot />
      </Suspense>
    </div>
  )
}
