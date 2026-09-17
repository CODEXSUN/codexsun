import type { UiRegistryEntry, UiRegistryLayer, UiRegistryState } from "@codexsun/ui";

export type GalleryLayer = "all" | UiRegistryLayer;

export const galleryLayers: readonly GalleryLayer[] = ["all", "component", "block", "page", "template"];

export function getGalleryEntries(entries: readonly UiRegistryEntry[], layer: GalleryLayer): readonly UiRegistryEntry[] {
  return layer === "all" ? entries : entries.filter((entry) => entry.layer === layer);
}

export function getSelectedEntry(
  entries: readonly UiRegistryEntry[],
  selectedId: string,
): UiRegistryEntry | undefined {
  return entries.find((entry) => entry.id === selectedId) ?? entries[0];
}

export function getPreviewState(entry: UiRegistryEntry, requestedState: UiRegistryState): UiRegistryState {
  return entry.states.includes(requestedState) ? requestedState : entry.states[0] ?? "default";
}
