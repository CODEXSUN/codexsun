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
    <section className="grid w-full gap-5">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="grid min-w-0 gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <Button className={actionMotion} onClick={onBack} variant="outline">
          <ArrowLeft /> Back
        </Button>
      </header>

      <form
        className="overflow-hidden rounded-md border bg-card shadow-sm"
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit()
        }}
      >
        <Tabs className="gap-0" defaultValue={firstTab}>
          <TabsList
            className="h-auto w-full justify-start overflow-x-auto rounded-none border-b bg-transparent px-6 pt-4"
            variant="line"
          >
            {tabs.map((tab) => (
              <TabsTrigger className="min-h-10 flex-none px-3" key={tab.id} value={tab.id}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {tabs.map((tab) => (
            <TabsContent className="p-6" key={tab.id} value={tab.id}>
              {tab.content}
            </TabsContent>
          ))}
        </Tabs>

        <div className="px-6 pb-6">
          <label className="flex min-h-12 items-center justify-between gap-4 rounded-md border border-success/35 bg-success/10 px-4 py-2.5 transition-colors hover:bg-success/15">
            <span className="font-medium">{activeLabel}</span>
            <Switch aria-label={activeLabel} checked={active} onCheckedChange={onActiveChange} />
          </label>
        </div>

        <footer className="flex flex-wrap gap-3 border-t px-6 py-4">
          <Button className={actionMotion} type="submit">
            <Save /> {submitLabel}
          </Button>
          <Button className={actionMotion} onClick={onCancel} type="button" variant="outline">
            <X /> Cancel
          </Button>
        </footer>
      </form>
    </section>
  )
}
