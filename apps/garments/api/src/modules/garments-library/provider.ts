export const garmentsLibraryApiProvider = {
  contracts: [
    "GET /api/garments/v1/assets/:path",
    "GET /api/garments/v1/documents",
    "GET /api/garments/v1/documents/:slug",
    "GET /api/garments/v1/scan",
    "PUT /api/garments/v1/documents/:slug",
    "POST /api/garments/v1/index/sync",
  ],
  events: { published: [], consumed: [] },
  id: "garments.library.api",
  owner: "apps/garments/api/modules/garments-library",
  version: "0.1.2",
} as const;
