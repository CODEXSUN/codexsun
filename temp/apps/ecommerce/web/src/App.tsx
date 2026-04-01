import { useEffect } from 'react'
import { AppRouter } from '@/app/router'
import { GlobalLoader } from '@/components/ui/global-loader'
import { AppToaster } from '@/components/ui/sonner'
import { useSetup } from '@/features/setup/components/setup-provider'
import { appTarget, frontendTarget } from '@/config/frontend'

const runtimeTargetStorageKey = 'codexsun.runtime.target.v1'
const resettableStorageKeys = [
  'codexsun.auth.requested-path',
  'codexsun.branding',
]

export function App() {
  const { isLoading, status } = useSetup()

  useEffect(() => {
    const runtimeTarget = `${appTarget ?? 'none'}:${frontendTarget}`
    const previousTarget = window.localStorage.getItem(runtimeTargetStorageKey)

    if (!previousTarget) {
      window.localStorage.setItem(runtimeTargetStorageKey, runtimeTarget)
      return
    }

    if (previousTarget === runtimeTarget) {
      return
    }

    for (const key of resettableStorageKeys) {
      window.localStorage.removeItem(key)
      window.sessionStorage.removeItem(key)
    }

    window.localStorage.setItem(runtimeTargetStorageKey, runtimeTarget)
    window.location.replace(window.location.origin)
  }, [])

  if (isLoading || !status) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(249,115,22,0.16),transparent_24%),linear-gradient(180deg,#f8fafc_0%,#e2e8f0_100%)] px-6 py-10 text-slate-950">
        <GlobalLoader/>
      </main>
    )
  }

  return (
    <>
      <AppRouter />
      <AppToaster />
    </>
  )
}
