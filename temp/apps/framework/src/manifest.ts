import { coreWorkspaceItems } from '../../core/domain/src/index'
import { ecommerceWorkspaceItems } from '../../ecommerce/domain/src/index'
import { frappeWorkspaceItems } from '../../frappe/domain/src/index'
import { frameworkServices, suiteApps } from './app-suite'
import { getSupportKnowledgeManifest } from './support/knowledge-manifest'

export function getFrameworkManifest() {
  return {
    framework: {
      services: frameworkServices,
    },
    appSuite: suiteApps,
    workspaces: {
      core: coreWorkspaceItems,
      ecommerce: ecommerceWorkspaceItems,
      frappe: frappeWorkspaceItems,
    },
    supportKnowledge: getSupportKnowledgeManifest(),
  }
}
