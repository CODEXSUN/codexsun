import type { SweTask } from "../contracts/swe-contracts.js";

export class SweTaskRepository {
  private readonly tasks = new Map<string, SweTask>();

  save(task: SweTask): SweTask {
    this.tasks.set(task.id, { ...task });
    return { ...task };
  }

  findById(id: string): SweTask | undefined {
    const task = this.tasks.get(id);
    return task ? { ...task } : undefined;
  }

  list(): SweTask[] {
    return Array.from(this.tasks.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  delete(id: string): boolean {
    return this.tasks.delete(id);
  }

  clear(): void {
    this.tasks.clear();
  }
}
