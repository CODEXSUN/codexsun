import { Alert, AlertDescription, AlertTitle } from '@codexsun/ui/components/alert'
import { Badge } from '@codexsun/ui/components/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@codexsun/ui/components/card'
import { Button } from '@codexsun/ui/components/button'
import { TopologyRegion } from '@codexsun/ui/features/interface-topology'
import { useMdiTopology } from '@codexsun/ui/layouts/mdi-main'
import { useSystemRuntime } from './system.hooks'

export function SystemWorkspace() {
  const runtime = useSystemRuntime()
  const topology = useMdiTopology()

  if (runtime.isPending)
    return <SystemMessage title="Loading runtime" message="Reading Platform module metadata." />
  if (runtime.isError) {
    return (
      <TopologyRegion as="main" className="mx-auto max-w-5xl p-6" id="10.3" topology={topology}>
        <Alert variant="destructive">
          <AlertTitle>Platform API unavailable</AlertTitle>
          <AlertDescription>{runtime.error.message}</AlertDescription>
        </Alert>
        <Button className="mt-4" onClick={() => void runtime.refetch()}>
          Retry
        </Button>
      </TopologyRegion>
    )
  }

  return (
    <TopologyRegion
      as="main"
      className="mx-auto max-w-5xl space-y-6 p-6"
      id="10"
      topology={topology}
    >
      <TopologyRegion as="header" id="10.1" topology={topology}>
        <p className="text-sm text-muted-foreground">Platform {runtime.data.platformVersion}</p>
        <h1 className="text-3xl font-semibold tracking-tight">System modules</h1>
      </TopologyRegion>
      <TopologyRegion
        as="section"
        className="grid gap-4 md:grid-cols-2"
        id="10.2"
        topology={topology}
      >
        {runtime.data.modules.map((module) => (
          <TopologyRegion as={Card} id="10.2.1" key={module.id} topology={topology}>
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <CardTitle>{module.id}</CardTitle>
                <Badge variant="secondary">v{module.version}</Badge>
              </div>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {module.capabilities.map((capability) => (
                <Badge key={capability} variant="outline">
                  {capability}
                </Badge>
              ))}
            </CardContent>
          </TopologyRegion>
        ))}
      </TopologyRegion>
    </TopologyRegion>
  )
}

function SystemMessage({ message, title }: { message: string; title: string }) {
  return (
    <main className="mx-auto max-w-5xl p-6">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">{message}</CardContent>
      </Card>
    </main>
  )
}
