import type {
  EngineeringExperience,
  SynthesizedHeuristic,
} from "../contracts/learning-contracts.js";

export class ExperienceRepository {
  private readonly experiences = new Map<string, EngineeringExperience>();
  private readonly heuristics = new Map<string, SynthesizedHeuristic>();

  saveExperience(experience: EngineeringExperience): EngineeringExperience {
    this.experiences.set(experience.id, { ...experience });
    return { ...experience };
  }

  findExperienceById(id: string): EngineeringExperience | undefined {
    const exp = this.experiences.get(id);
    return exp ? { ...exp } : undefined;
  }

  listExperiences(): EngineeringExperience[] {
    return Array.from(this.experiences.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  saveHeuristic(heuristic: SynthesizedHeuristic): SynthesizedHeuristic {
    this.heuristics.set(heuristic.id, { ...heuristic });
    return { ...heuristic };
  }

  findHeuristicById(id: string): SynthesizedHeuristic | undefined {
    const h = this.heuristics.get(id);
    return h ? { ...h } : undefined;
  }

  listHeuristics(): SynthesizedHeuristic[] {
    return Array.from(this.heuristics.values()).sort(
      (a, b) => b.effectivenessScore - a.effectivenessScore,
    );
  }

  clear(): void {
    this.experiences.clear();
    this.heuristics.clear();
  }
}
