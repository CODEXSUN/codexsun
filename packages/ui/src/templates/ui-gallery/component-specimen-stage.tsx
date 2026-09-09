import type { ReactNode } from 'react'

export function SpecimenStage({ compact, children }: { compact: boolean; children: ReactNode }) {
  return (
    <div
      className={
        compact
          ? 'mx-auto flex min-h-44 max-w-2xl items-center justify-center rounded-lg border bg-muted/20 p-4'
          : 'mx-auto flex min-h-64 max-w-4xl items-center justify-center rounded-xl border bg-background p-8 shadow-sm'
      }
    >
      {children}
    </div>
  )
}
