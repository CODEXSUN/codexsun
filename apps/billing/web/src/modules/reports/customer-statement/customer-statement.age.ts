export function formatCustomerStatementAge(value: string, today = new Date()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return "—";
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) return "—";
  const currentDay = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  return String(Math.max(0, Math.floor((currentDay - date.getTime()) / 86_400_000)));
}
