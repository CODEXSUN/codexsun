type StatusBadgeProps = {
  label: string;
  status: "online" | "offline" | "warning";
};

const statusClasses: Record<StatusBadgeProps["status"], string> = {
  online: "bg-emerald-100 text-emerald-800",
  offline: "bg-slate-100 text-slate-700",
  warning: "bg-amber-100 text-amber-800",
};

export function StatusBadge({ label, status }: StatusBadgeProps) {
  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${statusClasses[status]}`} aria-label={`${label}: ${status}`}>
      <span aria-hidden="true">•</span>
      {label}: {status}
    </span>
  );
}
