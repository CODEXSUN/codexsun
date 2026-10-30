import { blogContentSchema } from "@codexsun/sites-api/blog-contract";
export function validateBlog(value: unknown) {
  const result = blogContentSchema.safeParse(value);
  return result.success
    ? null
    : result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("\n");
}
