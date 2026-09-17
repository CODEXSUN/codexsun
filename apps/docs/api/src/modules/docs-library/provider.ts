export const docsLibraryApiProvider = {
  contracts: [
    "GET /api/docs/v1/assets/:path",
    "GET /api/docs/v1/documents",
    "GET /api/docs/v1/documents/:slug",
    "GET /api/docs/v1/scan",
    "PUT /api/docs/v1/documents/:slug",
    "POST /api/docs/v1/index/sync",
  ],
  events: { published: [], consumed: [] },
  id: "docs.library.api",
  owner: "apps/docs/api/modules/docs-library",
  version: "0.1.2",
} as const;
