export type UiStaticPageId = "blog-header" | "ecommerce-header" | "site-header";

export type UiStaticPageDoc = {
  id: UiStaticPageId;
  name: string;
};

export const uiStaticPageDocs: readonly UiStaticPageDoc[] = [
  { id: "site-header", name: "Site Header" },
  { id: "ecommerce-header", name: "E-Commerce Header" },
  { id: "blog-header", name: "Blog Header" },
];

export function findUiStaticPage(pageId: string | null): UiStaticPageDoc | undefined {
  return uiStaticPageDocs.find(({ id }) => id === pageId);
}
