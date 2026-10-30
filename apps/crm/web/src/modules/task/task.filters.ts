export function countTaskStatuses(counts: Array<{ code: string; count: number }>, filter: string) {
  const holds = ["hold-for-approval", "long-hold", "hold-for-spares", "hold-for-job-out"];
  const closed = ["won", "lost", "closed"];
  return counts.reduce((total, item) => {
    const matches =
      filter === "all"
        ? true
        : filter === "active"
          ? !closed.includes(item.code)
          : filter === "hold"
            ? holds.includes(item.code)
            : filter === "pending-group"
              ? ["open", "reopen", "escalation"].includes(item.code)
              : filter === "other"
                ? !["new", "open", "reopen", "escalation", ...holds, ...closed].includes(item.code)
                : item.code === filter;
    return total + (matches ? item.count : 0);
  }, 0);
}
