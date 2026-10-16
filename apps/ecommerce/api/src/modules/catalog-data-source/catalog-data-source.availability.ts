const scheduleTimeZone = "Asia/Kolkata";

export function isFrappeOperatingWindow(date: Date) {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      hour12: false,
      timeZone: scheduleTimeZone
    }).format(date)
  );
  return hour >= 8 && hour < 22;
}
