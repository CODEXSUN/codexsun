import {
  formatDate as formatWorkspaceDate,
  formatDateTime as formatWorkspaceDateTime
} from "@codexsun/ui/workspace";

export function formatDate(value: string | null) {
  return value ? formatWorkspaceDate(value) : "—";
}

export function formatScheduleDate(value: string | null) {
  if (!value) return "—";
  return formatWorkspaceDate(value);
}

export function formatListDueDate(value: string | null) {
  if (!value) return "—";
  return formatWorkspaceDate(value);
}

export function formatDateTime(value: string) {
  return formatWorkspaceDateTime(value);
}

export function formatCommentByline(author: string, createdAt: string, now = Date.now()) {
  const emailDomain = author.match(/@([^@.]+)(?:\.|$)/u)?.[1];
  const name = emailDomain || author;
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return name;

  const calendarDate = formatWorkspaceDate(date);
  const minutes = Math.trunc((now - date.getTime()) / 60_000);
  return `${name} · (${calendarDate}) . ${formatRelativeAge(minutes)}`;
}

function formatRelativeAge(minutes: number) {
  const elapsed = Math.abs(minutes);
  if (elapsed < 1) return "just now";
  let unit: string;
  if (elapsed < 60) unit = `${elapsed}m`;
  else if (elapsed < 1_440) unit = `${Math.floor(elapsed / 60)}h`;
  else if (elapsed < 43_200) unit = `${Math.floor(elapsed / 1_440)}d`;
  else if (elapsed < 525_600) unit = `${Math.floor(elapsed / 43_200)}mo`;
  else unit = `${Math.floor(elapsed / 525_600)}y`;
  return minutes < 0 ? `in ${unit}` : `${unit} ago`;
}

export function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1).replaceAll("_", " ");
}

export function whatsappUrl(value: string | null) {
  if (!value) return null;
  const digits = value.trim().replace(/^00/u, "").replace(/\D/gu, "");
  const phone = digits.length === 10 ? `91${digits}` : digits;
  return phone.length >= 8 && phone.length <= 15 ? `https://wa.me/${phone}` : null;
}
