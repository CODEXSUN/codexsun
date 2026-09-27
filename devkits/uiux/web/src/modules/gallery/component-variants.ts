import type { DesignSystemVariantDefinition } from "@codexsun/ui/design-system";
import type { UiComponentDoc } from "./ui-components";

export type UiComponentVariant = DesignSystemVariantDefinition;
export type UiComponentVariantId = string;

export const uiComponentDefaultVariant = "default";

export function getUiComponentVariants(component: UiComponentDoc): readonly UiComponentVariant[] {
  return component.variants;
}

export function resolveUiComponentVariant(
  component: UiComponentDoc,
  variantId: string | null,
  defaultVariantId = component.defaultVariantId,
): UiComponentVariant {
  return (
    getUiComponentVariants(component).find(({ id }) => id === variantId) ??
    getUiComponentVariants(component).find(({ id }) => id === defaultVariantId) ??
    getUiComponentVariants(component)[0]
  );
}
