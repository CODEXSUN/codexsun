import 'sonner/dist/styles.css'
import { Toaster } from 'sonner'
import { useThemeSettings } from '@framework-core/web/theme/theme-provider'

export function AppToaster() {
  const { resolvedMode } = useThemeSettings()

  return (
    <Toaster
      closeButton
      position="top-right"
      richColors
      theme={resolvedMode}
      toastOptions={{
        classNames: {
          toast: 'rounded-2xl border shadow-xl backdrop-blur-sm',
          title: 'font-display text-sm font-semibold',
          description: 'text-sm opacity-85',
          closeButton: 'bg-background/90 text-muted-foreground hover:bg-background hover:text-foreground',
          default: 'border-border bg-card/95 text-card-foreground',
          success: 'bg-emerald-500 text-white border-emerald-600 dark:bg-emerald-500 dark:text-white',
          error: 'bg-rose-500 text-white border-rose-600 dark:bg-rose-500 dark:text-white',
          warning: 'bg-amber-400 text-amber-950 border-amber-500 dark:bg-amber-400 dark:text-amber-950',
          info: 'bg-sky-500 text-white border-sky-600 dark:bg-sky-500 dark:text-white',
        },
      }}
    />
  )
}
