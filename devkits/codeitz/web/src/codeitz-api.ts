export interface SweTaskItem {
  id: string;
  title: string;
  prompt: string;
  phase: string;
  status: string;
  targetPaths: string[];
  createdAt: string;
}

export interface HeuristicItem {
  id: string;
  category: string;
  rule: string;
  triggerKeywords: string[];
  effectivenessScore: number;
}

export interface SkillItem {
  id: string;
  name: string;
  description: string;
  scope: string;
  markdown: string;
}

export async function fetchCodeitzHealth(fetchFn: typeof fetch = fetch): Promise<{ status: string; providers: string[] }> {
  const res = await fetchFn("/api/v1/codeitz/health");
  if (!res.ok) throw new Error(`Health request failed: ${res.status}`);
  return res.json();
}

export async function fetchSweTasks(fetchFn: typeof fetch = fetch): Promise<SweTaskItem[]> {
  const res = await fetchFn("/api/v1/codeitz/swe/tasks");
  if (!res.ok) throw new Error(`Tasks request failed: ${res.status}`);
  return res.json();
}

export async function createSweTask(
  data: { title: string; prompt: string; targetPaths?: string[] },
  fetchFn: typeof fetch = fetch,
): Promise<SweTaskItem> {
  const res = await fetchFn("/api/v1/codeitz/swe/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Create task failed: ${res.status}`);
  return res.json();
}

export async function fetchHeuristics(fetchFn: typeof fetch = fetch): Promise<HeuristicItem[]> {
  const res = await fetchFn("/api/v1/codeitz/learning/heuristics");
  if (!res.ok) throw new Error(`Heuristics request failed: ${res.status}`);
  return res.json();
}

export async function fetchSkills(fetchFn: typeof fetch = fetch): Promise<SkillItem[]> {
  const res = await fetchFn("/api/v1/codeitz/skills");
  if (!res.ok) throw new Error(`Skills request failed: ${res.status}`);
  return res.json();
}
