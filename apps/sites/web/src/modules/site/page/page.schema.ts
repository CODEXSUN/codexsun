import { pageContentSchema } from "@codexsun/sites-api/page-contract";
export function validatePageDraft(value: unknown) {
  const result = pageContentSchema.safeParse(value);
  return result.success
    ? null
    : result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("\n");
}
