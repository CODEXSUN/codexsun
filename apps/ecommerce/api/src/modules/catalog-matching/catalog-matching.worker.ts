import { CatalogMatchingRepository } from "./catalog-matching.repository.js";
import type { SemanticCatalogMatcher } from "./catalog-matching.types.js";

export const semanticCatalogMatchJobName = "ecommerce.catalog-match.semantic";

export async function processSemanticCatalogMatch(
  payload: Record<string, unknown>,
  matcher?: SemanticCatalogMatcher,
  repository = new CatalogMatchingRepository()
) {
  if (!matcher) {
    throw new Error(
      "No semantic catalog matcher is configured. Deterministic matching completed without a result."
    );
  }
  const matchRequestId = Number(payload.matchRequestId);
  const result = await matcher({
    matchRequestId,
    sourceReference: String(payload.sourceReference ?? "")
  });
  await repository.completeSemanticMatch(matchRequestId, result);
  return result ? { matched: true, ...result } : { matched: false };
}
