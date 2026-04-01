import { customAppArchitecture } from '@custom-domain/manifest'
import { Badge } from '@ui/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@ui/components/ui/card'
import { PageSection } from '@/shared/ui/page-section'
import { HealthBadge } from '../components/health-badge'
import { useApiHealth } from '../hooks/use-api-health'
import type { OverviewCard } from '../model/overview-card'

const rootCards: OverviewCard[] = customAppArchitecture.roots.map((root) => ({
  title: root.label,
  path: root.path,
  purpose: root.purpose,
}))

export function OverviewPage() {
  const apiHealth = useApiHealth()

  return (
    <div className="space-y-10">
      <PageSection
        eyebrow="Architecture"
        title={customAppArchitecture.title}
        description={customAppArchitecture.summary}
      >
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)]">
          <Card className="border-border/70 bg-card/90">
            <CardHeader>
              <CardTitle>Root boundaries</CardTitle>
              <CardDescription>
                The new app is split by responsibility before any business module is added.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              {rootCards.map((card) => (
                <div key={card.path} className="rounded-2xl border border-border/70 bg-background/70 p-4">
                  <p className="text-sm font-semibold text-foreground">{card.title}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.22em] text-muted-foreground">{card.path}</p>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{card.purpose}</p>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card className="border-border/70 bg-card/90">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle>Server check</CardTitle>
                  <CardDescription>
                    The frontend expects the standalone custom API on its own port.
                  </CardDescription>
                </div>
                <HealthBadge status={apiHealth.status} />
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
              <p>
                Expected API URL:
                {' '}
                <span className="font-medium text-foreground">VITE_CUSTOM_API_URL</span>
              </p>
              {apiHealth.data ? (
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/8 p-4">
                  <p className="font-medium text-foreground">{apiHealth.data.app}</p>
                  <p>Last response: {new Date(apiHealth.data.timestamp).toLocaleString()}</p>
                </div>
              ) : (
                <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                  <p>{apiHealth.error ?? 'Start `npm run dev:custom-api` to bring the server online.'}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </PageSection>

      <PageSection
        eyebrow="Module rule"
        title="Keep module and model folders separate from root glue"
        description="The backend and frontend templates are intentionally small so each new feature starts from the same structure."
      >
        <div className="grid gap-4 md:grid-cols-3">
          {customAppArchitecture.moduleLayers.map((layer) => (
            <Card key={layer.label} className="border-border/70 bg-card/90">
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle>{layer.label}</CardTitle>
                    <CardDescription>{layer.purpose}</CardDescription>
                  </div>
                  <Badge variant="outline" className="rounded-full">
                    {layer.folders.length} folders
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {layer.folders.map((folder) => (
                  <Badge key={folder} variant="secondary" className="rounded-full">
                    {folder}
                  </Badge>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </PageSection>
    </div>
  )
}
