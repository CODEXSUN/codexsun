import { designSystemBlocks, designSystemManifest } from "@codexsun/ui/design-system";

export type UiBlockId = (typeof designSystemBlocks)[number]["id"];

export type UiBlockDoc = {
  id: UiBlockId;
  name: string;
  source: string;
  manifest?: (typeof designSystemManifest)[number];
};

export const uiBlockDocs: readonly UiBlockDoc[] = designSystemBlocks.map(({ id, name, source }) => ({
  id,
  name,
  source,
  manifest: designSystemManifest.find((asset) => asset.kind === "block" && asset.id === id),
}));

export function findUiBlock(blockId: string | null): UiBlockDoc | undefined {
  return uiBlockDocs.find(({ id }) => id === blockId);
}
