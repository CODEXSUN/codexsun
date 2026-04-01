import { customAppArchitecture } from '../../../../../domain/src/manifest'
import type { ArchitectureManifestResponse } from '../model/architecture-manifest-response'

export function getArchitectureManifest(): ArchitectureManifestResponse {
  return {
    architecture: customAppArchitecture,
  }
}
