final _isoTimestamp = RegExp(
  r'\b\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?\b',
);

final _javascriptTimestamp = RegExp(
  r'\b(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s+'
  r'(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+'
  r'(\d{1,2})\s+(\d{4})\s+(\d{2}):(\d{2}):(\d{2})\s+'
  r'GMT([+-])(\d{2})(\d{2})(?:\s+\([^)]+\))?',
);

const _monthNumbers = {
  'Jan': 1,
  'Feb': 2,
  'Mar': 3,
  'Apr': 4,
  'May': 5,
  'Jun': 6,
  'Jul': 7,
  'Aug': 8,
  'Sep': 9,
  'Oct': 10,
  'Nov': 11,
  'Dec': 12,
};

String formatWorkTimestamps(String text) {
  final withIsoDates = text.replaceAllMapped(_isoTimestamp, (match) {
    final parsed = DateTime.tryParse(match[0]!);
    return parsed == null ? match[0]! : formatWorkDateTime(parsed);
  });
  return withIsoDates.replaceAllMapped(_javascriptTimestamp, (match) {
    final month = _monthNumbers[match[1]];
    if (month == null) return match[0]!;
    final offset = Duration(
      hours: int.parse(match[8]!),
      minutes: int.parse(match[9]!),
    );
    final signedOffset = match[7] == '+' ? offset : -offset;
    final utc = DateTime.utc(
      int.parse(match[3]!),
      month,
      int.parse(match[2]!),
      int.parse(match[4]!),
      int.parse(match[5]!),
      int.parse(match[6]!),
    ).subtract(signedOffset);
    return formatWorkDateTime(utc);
  });
}

String formatWorkDateTime(DateTime value) {
  final local = value.toLocal();
  final hour = local.hour % 12 == 0 ? 12 : local.hour % 12;
  final period = local.hour < 12 ? 'am' : 'pm';
  final day = local.day.toString().padLeft(2, '0');
  final month = local.month.toString().padLeft(2, '0');
  final year = (local.year % 100).toString().padLeft(2, '0');
  final hourText = hour.toString().padLeft(2, '0');
  final minute = local.minute.toString().padLeft(2, '0');
  final second = local.second.toString().padLeft(2, '0');
  return '$day-$month-$year $hourText:$minute:$second $period';
}
