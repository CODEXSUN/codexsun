import { deterministicCatalogMatch } from "./catalog-matching.domain.js";
import { CatalogMatchingRepository } from "./catalog-matching.repository.js";
import type {
  CatalogMatchFilters,
  CatalogMatchInput,
  CatalogMatchStatus
} from "./catalog-matching.types.js";

export class CatalogMatchingService {
  constructor(private readonly repository = new CatalogMatchingRepository()) {}

  list(filters: CatalogMatchFilters = {}) {
    return this.repository.list(filters);
  }

  async match(input: CatalogMatchInput) {
    const normalized = {
      ...input,
      sourceReference: input.sourceReference.trim(),
      title: input.title.trim()
    };
    const existing = await this.repository.findBySource(normalized.sourceReference);
    if (existing) return existing;

    const decision = deterministicCatalogMatch(normalized, await this.repository.candidates());
    const status: CatalogMatchStatus = decision.candidate
      ? "matched"
      : input.allowSemantic
        ? "semantic_pending"
        : "unmatched";
    return this.repository.saveDecision(normalized, decision, status);
  }
}
