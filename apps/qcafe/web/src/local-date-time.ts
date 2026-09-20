export function localDateTime(minutesFromNow = 0): string {
  const now = new Date();
  now.setMinutes(now.getMinutes() + minutesFromNow);
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 16);
}

export function toOffsetDateTime(value: string): string {
  const offsetMinutes = new Date(value).getTimezoneOffset();
  const sign = offsetMinutes <= 0 ? "+" : "-";
  const absolute = Math.abs(offsetMinutes);
  const hours = String(Math.floor(absolute / 60)).padStart(2, "0");
  const minutes = String(absolute % 60).padStart(2, "0");
  return `${value}:00${sign}${hours}:${minutes}`;
}
