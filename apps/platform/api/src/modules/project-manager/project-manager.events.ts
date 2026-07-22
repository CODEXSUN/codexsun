export const projectManagerEvents = {
  changed: "platform.project-manager.changed",
  registryChanged: "platform.project-manager.registry-changed"
} as const;

export function createProjectManagerEvent(
  action: "created" | "updated" | "status-changed",
  payload: { id: string; kind: string }
) {
  return {
    name: projectManagerEvents.changed,
    occurredAt: new Date().toISOString(),
    payload: { action, ...payload },
    version: 1
  };
}
