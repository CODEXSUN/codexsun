import type { ReactNode } from 'react'
import { TopologyRegion, type InterfaceTopologyController } from '../../features/interface-topology'
import { cn } from '../../lib/utils'
import { UiTemplateCode } from './ui-template-code'
import { UiTemplateHeader, type UiTemplateKind } from './ui-template-header'
import { UiTemplateNavigation, type UiTemplateNavigationItem } from './ui-template-navigation'

export type UiTemplatePageProps = {
  code: string
  importPath: string
  kind: UiTemplateKind
  name: string
  navigation?: {
    next?: UiTemplateNavigationItem
    previous?: UiTemplateNavigationItem
  }
  preview: ReactNode
  previewClassName?: string
  topology: InterfaceTopologyController
  topologyIds: {
    page: string
    preview: string
    usage: string
  }
  usageDescription: ReactNode
}

export function UiTemplatePage({
  code,
  importPath,
  kind,
  name,
  navigation,
  preview,
  previewClassName,
  topology,
  topologyIds,
  usageDescription,
}: UiTemplatePageProps) {
  return (
    <TopologyRegion
      as="main"
      className="h-full overflow-y-auto bg-background"
      id={topologyIds.page}
      topology={topology}
    >
      <UiTemplateHeader
        importPath={importPath}
        kind={kind}
        name={name}
        topologyLabelsVisible={topology.labelsVisible}
      />
      <div className="grid min-w-0 gap-10 py-8">
        <TopologyRegion
          as="section"
          className={cn('mx-auto w-[90%] min-w-0', previewClassName)}
          id={topologyIds.preview}
          topology={topology}
        >
          {preview}
        </TopologyRegion>

        <TopologyRegion
          as="section"
          className="mx-auto grid w-[90%] min-w-0 gap-5 pt-10 pb-8"
          id={topologyIds.usage}
          topology={topology}
        >
          <div className="grid gap-1.5">
            <h2 className="text-xl font-semibold tracking-tight">
              Use the shared {name} {kind.toLowerCase()}
            </h2>
            <div className="max-w-3xl text-sm leading-6 text-muted-foreground">
              {usageDescription}
            </div>
          </div>
          <UiTemplateCode code={code} />
          {navigation ? (
            <UiTemplateNavigation next={navigation.next} previous={navigation.previous} />
          ) : null}
        </TopologyRegion>
      </div>
    </TopologyRegion>
  )
}
