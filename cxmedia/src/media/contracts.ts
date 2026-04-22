export type MediaVisibility = "public" | "private"

export type MediaObjectSummary = {
  byteSize: number | null
  contentType: string
  createdAt: string | null
  etag: string | null
  path: string
  privateUrl: string
  publicUrl: string
  transformUrls: {
    crop: string
    resize: string
  }
  visibility: MediaVisibility
}
