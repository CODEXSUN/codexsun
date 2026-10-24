const isoTimestamp = /\b\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})\b/gu;
const legacyTimestamp =
  /\b(Started|Completed|Captured) @ (\d{2})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2}) (AM|PM)\b/giu;

export function formatCrmDateTime(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return String(value);

  const hour = date.getHours();
  const hour12 = hour % 12 || 12;
  const twoDigits = (part: number) => String(part).padStart(2, "0");
  const period = hour < 12 ? "am" : "pm";
  return `${twoDigits(date.getDate())}-${twoDigits(date.getMonth() + 1)}-${date.getFullYear()} ${twoDigits(hour12)}:${twoDigits(date.getMinutes())}:${twoDigits(date.getSeconds())} ${period}`;
}

export function formatCrmWorkTimestamps(text: string) {
  const withIsoDates = text.replace(isoTimestamp, (timestamp) => {
    const date = new Date(timestamp);
    return Number.isNaN(date.getTime()) ? timestamp : formatCrmDateTime(date);
  });
  const isJobCycle = /Job #\S+ completed/iu.test(text);
  const isCheckpointCycle = /\bCheck (?:in|out)\b/iu.test(text);
  const isPinnedLocation = /^\s*Pinned location\b/iu.test(text);

  return withIsoDates.replace(
    legacyTimestamp,
    (timestamp, label, day, month, year, hour, minute, second, period) => {
      const normalizedLabel = String(label).toLowerCase();
      const isServerTimestamp =
        (isJobCycle && (normalizedLabel === "started" || normalizedLabel === "completed")) ||
        (isCheckpointCycle && normalizedLabel === "captured");
      if (!isServerTimestamp && !(isPinnedLocation && normalizedLabel === "captured")) {
        return timestamp;
      }

      const hour12 = Number(hour);
      const localHour = (hour12 % 12) + (String(period).toUpperCase() === "PM" ? 12 : 0);
      const fullYear = Number(year) + 2000;
      const monthIndex = Number(month) - 1;
      const dayNumber = Number(day);
      const minuteNumber = Number(minute);
      const secondNumber = Number(second);
      const date = isServerTimestamp
        ? new Date(Date.UTC(fullYear, monthIndex, dayNumber, localHour, minuteNumber, secondNumber))
        : new Date(fullYear, monthIndex, dayNumber, localHour, minuteNumber, secondNumber);
      return `${label} @ ${formatCrmDateTime(date)}`;
    }
  );
}
