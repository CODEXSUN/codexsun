import { ArrowRight } from "lucide-react";
import { Button } from "@codexsun/ui/components/button";
import type { TaskLookup, TaskRecord } from "./task.types";

export function TaskCreationContext({
  tasks,
  users,
  selectedUserId,
  onSelectAssignee,
  onOpenTask,
  onCancel
}: {
  tasks: TaskRecord[];
  users: TaskLookup[];
  selectedUserId: number | null;
  onSelectAssignee: (id: number) => void;
  onOpenTask: (id: string) => void;
  onCancel: () => void;
}) {
  const recentTasks = tasks.slice(0, 5);
  const userNames = new Map(users.map((user) => [user.id, user.name]));
  const recentAssignees = [
    ...new Map(
      tasks
        .filter((task) => task.assignedUserId !== null)
        .map((task) => [
          task.assignedUserId!,
          {
            id: task.assignedUserId!,
            name: task.assignedTo ?? userNames.get(task.assignedUserId!) ?? "User"
          }
        ])
    ).values()
  ].slice(0, 5);

  return (
    <aside className="space-y-4" aria-label="Task context">
      <section className="overflow-hidden rounded-md border bg-background shadow-sm">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-sm font-medium">Existing tasks</h2>
          <span className="text-xs text-muted-foreground">{recentTasks.length} recent</span>
        </div>
        <div className="divide-y px-4">
          {recentTasks.length ? (
            recentTasks.map((task) => (
              <button
                key={task.id}
                type="button"
                className="w-full cursor-pointer py-3 text-left hover:bg-muted/40"
                onClick={() => onOpenTask(String(task.id))}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium">
                    #{task.id} · {task.title}
                  </span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                    {task.statusName}
                  </span>
                </div>
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {task.listIn ?? "No list"} · {task.assignedTo ?? "Unassigned"}
                </p>
              </button>
            ))
          ) : (
            <p className="py-4 text-xs text-muted-foreground">No existing tasks found.</p>
          )}
        </div>
        <button
          type="button"
          className="flex w-full cursor-pointer items-center justify-between border-t px-4 py-3 text-sm font-medium hover:bg-muted/40"
          onClick={onCancel}
        >
          See more in all Tasks
          <ArrowRight className="size-4" aria-hidden="true" />
        </button>
      </section>
      <section className="overflow-hidden rounded-md border bg-background shadow-sm">
        <div className="border-b px-4 py-3">
          <h2 className="text-sm font-medium">Recent assignees</h2>
        </div>
        <div className="space-y-1 p-2">
          {recentAssignees.length ? (
            recentAssignees.map((user) => (
              <button
                key={user.id}
                type="button"
                className={`w-full cursor-pointer rounded px-2 py-2 text-left text-sm hover:bg-muted ${selectedUserId === user.id ? "bg-muted font-medium" : ""}`}
                onClick={() => onSelectAssignee(user.id)}
              >
                {user.name}
              </button>
            ))
          ) : (
            <p className="px-2 py-3 text-xs text-muted-foreground">
              Assignees from recent tasks will appear here.
            </p>
          )}
        </div>
        <div className="border-t p-3">
          <Button type="button" variant="outline" className="w-full" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </section>
    </aside>
  );
}
