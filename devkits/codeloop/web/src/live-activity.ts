export type LiveActivityPhase = "working" | "thinking" | "reasoning" | "running" | "command" | "waiting" | "completed" | "error";

export type LiveActivity = {
  id: string;
  providerId?: string;
  phase: LiveActivityPhase;
  status: "active" | "complete" | "error";
  message: string;
  tool?: string;
  callId?: string;
  durationMs?: number;
};

export type LiveActivityEvent = Omit<LiveActivity, "id"> & { id?: string; type: "activity" };

export function applyLiveActivity(current: readonly LiveActivity[], event: LiveActivityEvent): LiveActivity[] {
  const id = event.callId ? `${event.providerId ?? "provider"}:${event.callId}` : `${event.providerId ?? "provider"}:${event.phase}`;
  const next = { ...event, id };
  const index = current.findIndex((item) => item.id === id);
  if (index < 0) return [...current, next];
  return current.map((item, itemIndex) => itemIndex === index ? next : item);
}
