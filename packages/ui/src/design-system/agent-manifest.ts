import { designSystemBlocks } from "./block-registry";
import { designSystemComponents } from "./component-registry";
import { designSystemPages } from "./page-registry";
import { designSystemTemplates } from "./template-registry";
import type {
  DesignSystemAssetKind,
  DesignSystemAssetManifest,
  DesignSystemOwnership,
  DesignSystemVariantDefinition,
} from "./contracts";

const packageOwnership = Object.freeze([
  "visual structure",
  "semantic styling",
  "accessibility defaults",
  "typed UI callbacks",
]);
const applicationOwnership = Object.freeze([
  "business data",
  "fields and validation",
  "routes and permissions",
  "persistence and workflows",
]);

export const designSystemManifest: readonly DesignSystemAssetManifest[] = Object.freeze([
  ...designSystemBlocks.map((definition) => createManifestEntry("block", definition)),
  ...designSystemComponents.map((definition) =>
    createManifestEntry("component", {
      ...definition,
      description: `Reusable ${definition.name} UI primitive.`,
    }),
  ),
  ...designSystemPages.map((definition) => createManifestEntry("page", definition)),
  ...designSystemTemplates.map((definition) => createManifestEntry("template", definition)),
]);

export function getDesignSystemAsset(assetId: string, kind?: DesignSystemAssetKind) {
  return designSystemManifest.find((asset) => asset.id === assetId && (!kind || asset.kind === kind));
}

export function validateDesignSystemManifest(manifest: readonly DesignSystemAssetManifest[] = designSystemManifest) {
  const seen = new Set<string>();
  const errors: string[] = [];

  for (const asset of manifest) {
    const key = `${asset.kind}:${asset.id}`;
    if (seen.has(key)) errors.push(`Duplicate asset: ${key}`);
    seen.add(key);
    if (!asset.variants.some(({ id }) => id === asset.defaultVariantId)) {
      errors.push(`Missing default variant: ${key}:${asset.defaultVariantId}`);
    }
    if (!asset.source.startsWith("@codexsun/ui/")) errors.push(`Invalid package source: ${key}`);
    if (!asset.ownership.packageOwns.length || !asset.ownership.applicationOwns.length) {
      errors.push(`Incomplete ownership contract: ${key}`);
    }
  }

  return Object.freeze({ valid: errors.length === 0, errors });
}

function createManifestEntry(
  kind: DesignSystemAssetKind,
  definition: {
    defaultVariantId: string;
    description: string;
    id: string;
    name: string;
    source: string;
    variants: readonly DesignSystemVariantDefinition[];
  },
): DesignSystemAssetManifest {
  const ownership: DesignSystemOwnership = { applicationOwns: applicationOwnership, packageOwns: packageOwnership };
  return Object.freeze({
    defaultVariantId: definition.defaultVariantId,
    description: definition.description,
    id: definition.id,
    kind,
    name: definition.name,
    ownership,
    source: definition.source,
    variants: definition.variants,
  });
}
