export type SeoValidationInput = {
  canonical: string;
  description: string;
  h1: string;
  schemaType?: string;
  title: string;
};

export function validateSeoMetadata(input: SeoValidationInput): string[] {
  const errors: string[] = [];
  if (!input.title.trim()) errors.push("title is required");
  if (input.title.length > 60) errors.push("title exceeds 60 characters");
  if (!input.description.trim()) errors.push("description is required");
  if (input.description.length > 160) errors.push("description exceeds 160 characters");
  if (!input.h1.trim()) errors.push("one H1 is required");
  try { new URL(input.canonical); } catch { errors.push("canonical must be an absolute URL"); }
  if (!input.schemaType?.trim()) errors.push("schema type is required");
  return errors;
}
