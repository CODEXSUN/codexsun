import { designSystemTemplates } from '@codexsun/ui/design-system';

export const uiTemplateDocs = designSystemTemplates.map(({ defaultVariantId, id, name, source, variants }) => ({
  defaultVariantId,
  id,
  name,
  source,
  variants,
}));

export function findUiTemplate(id: string | null) {
  return uiTemplateDocs.find((template) => template.id === id);
}
