export type MatchStrategy = "sku" | "barcode" | "slug" | "title-brand" | "semantic" | "none";
export type CatalogMatchStatus = "matched" | "semantic_pending" | "unmatched";

export type CatalogMatchInput = {
  allowSemantic?: boolean;
  barcode?: string;
  brand?: string;
  correlationId?: string;
  sku?: string;
  slug?: string;
  sourceReference: string;
  title: string;
};

export type CatalogMatchCandidate = {
  barcode: string;
  brand: string;
  productInformationId: number;
  sku: string;
  slug: string;
  title: string;
  variantId: number | null;
};

export type CatalogMatchDecision = {
  candidate: CatalogMatchCandidate | null;
  confidence: number;
  strategy: MatchStrategy;
};

export type CatalogMatchRecord = {
  confidence: number;
  correlationId: string;
  createdAt: string;
  id: number;
  productInformationId: number | null;
  query: Omit<CatalogMatchInput, "allowSemantic" | "correlationId">;
  sourceReference: string;
  status: CatalogMatchStatus;
  strategy: MatchStrategy;
  updatedAt: string;
  uuid: string;
  variantId: number | null;
};

export type CatalogMatchFilters = {
  search?: string;
  status?: CatalogMatchStatus;
};

export type SemanticCatalogMatcher = (input: {
  matchRequestId: number;
  sourceReference: string;
}) => Promise<{
  confidence: number;
  productInformationId: number;
  variantId: number | null;
} | null>;
