import { lazy, type ComponentType, type LazyExoticComponent } from 'react'
import type { SuiteAppId } from '../../app-suite'

export type FrontendShellId = Extract<SuiteAppId, 'billing' | 'ecommerce' | 'mcp'>

export interface FrontendShellDefinition {
  id: FrontendShellId
  name: string
  Root: LazyExoticComponent<ComponentType<object>>
}

export function defineFrontendShell(
  id: FrontendShellId,
  name: string,
  loader: () => Promise<Record<string, ComponentType<object>>>,
  exportName: string,
): FrontendShellDefinition {
  return {
    id,
    name,
    Root: lazy(async () => ({ default: (await loader())[exportName] })),
  }
}
