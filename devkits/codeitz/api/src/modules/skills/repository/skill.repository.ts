import type { SkillDefinition } from "../contracts/skills-contracts.js";

export class SkillRepository {
  private readonly skills = new Map<string, SkillDefinition>();

  save(skill: SkillDefinition): SkillDefinition {
    this.skills.set(skill.id, { ...skill });
    return { ...skill };
  }

  findById(id: string): SkillDefinition | undefined {
    const s = this.skills.get(id);
    return s ? { ...s } : undefined;
  }

  findByName(name: string): SkillDefinition | undefined {
    return Array.from(this.skills.values()).find((s) => s.name === name);
  }

  list(): SkillDefinition[] {
    return Array.from(this.skills.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  delete(id: string): boolean {
    return this.skills.delete(id);
  }

  clear(): void {
    this.skills.clear();
  }
}
