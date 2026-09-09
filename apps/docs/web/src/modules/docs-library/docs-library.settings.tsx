import type { DocumentationScanResponse } from '@codexsun/docs-contracts'
import { Badge } from '@codexsun/ui/components/badge'
import { Button } from '@codexsun/ui/components/button'
import { ArrowLeft, FileSearch, FileWarning, RefreshCw, TextSearch } from 'lucide-react'
import { useEffect, useState } from 'react'
import { scanDocumentation } from './docs-library.services'

export function DocsLibrarySettings({ onBack }: { onBack: () => void }) {
  const [result, setResult] = useState<DocumentationScanResponse>()
  const [error, setError] = useState<string>()
  const [scanning, setScanning] = useState(true)

  useEffect(() => {
    void runScan()
  }, [])

  async function runScan() {
    if (scanning && result) return
    setScanning(true)
    setError(undefined)
    try {
      const nextResult = await scanDocumentation()
      setResult(nextResult)
    } catch (scanError) {
      setError(toMessage(scanError))
    } finally {
      setScanning(false)
    }
  }

  const issueCount =
    (result?.missingDocumentation.length ?? 0) + (result?.unorganizedFiles.length ?? 0)

  return (
    <section
      className="size-full overflow-y-auto bg-background"
      aria-labelledby="docs-settings-title"
    >
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-10 lg:px-10">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <Button
              aria-label="Back to documentation"
              size="icon"
              variant="outline"
              onClick={onBack}
            >
              <ArrowLeft />
            </Button>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Settings</p>
              <h1 id="docs-settings-title" className="text-2xl font-semibold tracking-tight">
                Documentation health
              </h1>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                Scan repository-owned documentation without moving or changing source files.
              </p>
            </div>
          </div>
          <Button disabled={scanning} variant="secondary" onClick={() => void runScan()}>
            <RefreshCw className={scanning ? 'animate-spin' : ''} />
            {scanning ? 'Scanning' : 'Scan documentation'}
          </Button>
        </header>

        {error ? (
          <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        {result ? (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              <Metric icon={FileSearch} label="Issues found" value={issueCount} />
              <Metric
                icon={FileWarning}
                label="Missing READMEs"
                value={result.missingDocumentation.length}
              />
              <Metric
                icon={TextSearch}
                label="Unorganized files"
                value={result.unorganizedFiles.length}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Last scanned {new Date(result.scannedAt).toLocaleString()}.
            </p>
            <IssueList
              description="Each owned application, package, and module needs a README.md."
              empty="Every scanned owned folder has a README.md."
              issues={result.missingDocumentation}
              title="Missing documentation"
            />
            <IssueList
              description="These Markdown, MDX, or text files appear outside assist, applications, packages, or runtime documentation roots. They also appear in the Unorganized files sidebar group."
              empty="No unorganized Markdown, MDX, or text sources were found."
              issues={result.unorganizedFiles}
              title="Unorganized sources"
            />
          </>
        ) : null}
      </div>
    </section>
  )
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof FileSearch
  label: string
  value: number
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-muted/20 p-4">
      <Icon className="size-4 text-muted-foreground" />
      <div>
        <p className="font-semibold text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}

function IssueList({
  description,
  empty,
  issues,
  title,
}: {
  description: string
  empty: string
  issues: DocumentationScanResponse['missingDocumentation']
  title: string
}) {
  return (
    <section className="overflow-hidden rounded-lg border" aria-label={title}>
      <header className="border-b bg-muted/20 px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="m-0 text-base font-semibold">{title}</h2>
          <Badge variant="outline">{issues.length}</Badge>
        </div>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
      </header>
      {issues.length ? (
        <ul className="divide-y">
          {issues.map((issue) => (
            <li className="px-5 py-4" key={`${issue.kind}:${issue.path}`}>
              <code className="text-sm font-medium text-foreground">{issue.path}</code>
              <p className="mt-1 text-sm text-muted-foreground">{issue.description}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-5 py-4 text-sm text-muted-foreground">{empty}</p>
      )}
    </section>
  )
}

function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Could not scan repository documentation.'
}
