import type {
  CatalogMatchCandidate,
  CatalogMatchDecision,
  CatalogMatchInput
} from "./catalog-matching.types.js";

export function deterministicCatalogMatch(
  input: CatalogMatchInput,
  candidates: CatalogMatchCandidate[]
): CatalogMatchDecision {
  const rules: Array<{
    confidence: number;
    strategy: CatalogMatchDecision["strategy"];
    value: string;
    read: (candidate: CatalogMatchCandidate) => string;
  }> = [
    { confidence: 1, strategy: "sku", value: input.sku ?? "", read: (candidate) => candidate.sku },
    {
      confidence: 1,
      strategy: "barcode",
      value: input.barcode ?? "",
      read: (candidate) => candidate.barcode
    },
    {
      confidence: 0.98,
      strategy: "slug",
      value: input.slug ?? "",
      read: (candidate) => candidate.slug
    }
  ];
  for (const rule of rules) {
    const value = identity(rule.value);
    if (!value) continue;
    const candidate = candidates.find((item) => identity(rule.read(item)) === value);
    if (candidate) return { candidate, confidence: rule.confidence, strategy: rule.strategy };
  }
  const title = identity(input.title),
    brand = identity(input.brand ?? "");
  if (!title || !brand) return { candidate: null, confidence: 0, strategy: "none" };
  const candidate = candidates.find(
    (item) => identity(item.title) === title && identity(item.brand) === brand
  );
  return candidate
    ? { candidate, confidence: 0.95, strategy: "title-brand" }
    : { candidate: null, confidence: 0, strategy: "none" };
}

function identity(value: string) {
  return value
    .trim()
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/gu, " ")
    .trim();
}
