import type { ReactNode } from 'react'
import { ArrowLeft, Save, X } from 'lucide-react'
import { Button } from '../../components/button'
import { Switch } from '../../components/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/tabs'

export type FormBlockTab = {
  content: ReactNode
  id: string
  label: string
}

export type FormBlockProps = {
  active: boolean
  activeLabel?: string
  defaultTab?: string
  description: string
  onActiveChange: (active: boolean) => void
  onBack: () => void
  onCancel: () => void
  onSubmit: () => void
  submitLabel?: string
  tabs: readonly FormBlockTab[]
  title: string
}

const actionMotion =
  'transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md motion-reduce:transform-none motion-reduce:transition-none'

export function FormBlock({
  active,
  activeLabel = 'Active',
  defaultTab,
  description,
  onActiveChange,
  onBack,
  onCancel,
  onSubmit,
  submitLabel = 'Save',
  tabs,
  title,
}: FormBlockProps) {
  const firstTab = defaultTab ?? tabs[0]?.id

  return (
    <section className="w-full">
      <form
        className="grid gap-3"
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit()
        }}
      >
        <header className="flex min-h-12 flex-wrap items-center justify-between gap-2 rounded-md border bg-card px-4 py-2 shadow-sm">
          <div className="flex min-w-0 items-center gap-3">
            <Button
              className={actionMotion}
              onClick={onBack}
              size="sm"
              type="button"
              variant="outline"
            >
              <ArrowLeft /> Back
            </Button>
            <h1 className="truncate text-sm font-semibold">{title}</h1>
            <p className="sr-only">{description}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              className={actionMotion}
              onClick={onCancel}
              size="sm"
              type="button"
              variant="outline"
            >
              <X /> Cancel
            </Button>
            <Button className={actionMotion} size="sm" type="submit">
              <Save /> {submitLabel}
            </Button>
          </div>
        </header>

        <div className="overflow-hidden rounded-md border bg-card shadow-sm">
          <Tabs className="gap-0" defaultValue={firstTab}>
            <TabsList
              className="h-auto w-full justify-start overflow-x-auto rounded-none border-b bg-transparent px-4 pt-2"
              variant="line"
            >
              {tabs.map((tab) => (
                <TabsTrigger className="min-h-10 flex-none px-3" key={tab.id} value={tab.id}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
            {tabs.map((tab) => (
              <TabsContent className="p-4" key={tab.id} value={tab.id}>
                {tab.content}
              </TabsContent>
            ))}
          </Tabs>

          <div className="px-4 pb-4">
            <label className="flex min-h-12 items-center justify-between gap-4 rounded-md border border-success/35 bg-success/10 px-4 py-2.5 transition-colors hover:bg-success/15">
              <span className="font-medium">{activeLabel}</span>
              <Switch aria-label={activeLabel} checked={active} onCheckedChange={onActiveChange} />
            </label>
          </div>
        </div>
      </form>
    </section>
  )
}
