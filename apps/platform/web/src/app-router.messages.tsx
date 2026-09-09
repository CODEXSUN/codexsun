import { Button } from '@codexsun/ui/components/button'

export function LoadingPage() {
  return <PageMessage title="Loading page" />
}

export function RouteError({ error, reset }: { error: Error; reset: () => void }) {
  return <PageMessage action={reset} message={error.message} title="The page failed to load" />
}

export function NotFound() {
  return <PageMessage message="The requested route does not exist." title="Page not found" />
}

function PageMessage({
  action,
  message,
  title,
}: {
  action?: () => void
  message?: string
  title: string
}) {
  return (
    <div className="grid h-full place-items-center p-8 text-center">
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">{title}</h1>
        {message ? <p className="text-muted-foreground">{message}</p> : null}
        {action ? <Button onClick={action}>Retry</Button> : null}
      </div>
    </div>
  )
}
