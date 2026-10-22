import '../../core/api/crm_mobile_api.dart';

String formatJobDuration(CrmJobExecution job, {DateTime? now}) {
  final seconds = _durationSeconds(job, now: now);
  if (seconds == null) return 'Running';
  if (seconds < 60) return '$seconds sec';
  final hours = seconds ~/ 3600;
  final minutes = (seconds % 3600) ~/ 60;
  if (hours == 0) return '$minutes min';
  return minutes == 0 ? '$hours hr' : '$hours hr $minutes min';
}

String formatJobDurationClock(CrmJobExecution job, {DateTime? now}) {
  final seconds = jobElapsedSeconds(job, now: now);
  final hours = seconds ~/ 3600;
  final minutes = (seconds % 3600) ~/ 60;
  final remainingSeconds = seconds % 60;
  final paddedMinutes = minutes.toString().padLeft(2, '0');
  final paddedSeconds = remainingSeconds.toString().padLeft(2, '0');
  if (hours == 0) return '$paddedMinutes:$paddedSeconds';
  return '$hours:$paddedMinutes:$paddedSeconds';
}

int jobElapsedSeconds(CrmJobExecution job, {DateTime? now}) =>
    _durationSeconds(job, now: now) ?? 0;

List<CrmJob> sortRunningJobsFirst(Iterable<CrmJob> jobs) {
  final now = DateTime.now();
  final indexed = jobs.indexed.toList();
  indexed.sort((left, right) {
    final leftRunning = left.$2.jobs.where((job) => job.isRunning).firstOrNull;
    final rightRunning = right.$2.jobs
        .where((job) => job.isRunning)
        .firstOrNull;
    if (leftRunning == null && rightRunning == null) {
      return left.$1.compareTo(right.$1);
    }
    if (leftRunning == null) return 1;
    if (rightRunning == null) return -1;
    final durationOrder = jobElapsedSeconds(
      rightRunning,
      now: now,
    ).compareTo(jobElapsedSeconds(leftRunning, now: now));
    return durationOrder == 0 ? left.$1.compareTo(right.$1) : durationOrder;
  });
  return indexed.map((entry) => entry.$2).toList();
}

int? _durationSeconds(CrmJobExecution job, {DateTime? now}) {
  final start = _secondsFromTime(job.startTime);
  final stop = _secondsFromTime(job.stopTime);
  if (start != null && stop != null) {
    final elapsed = stop >= start ? stop - start : stop + 86400 - start;
    return elapsed;
  }
  if (job.isRunning) return _runningSeconds(job, start, now: now);
  return (job.hours * 3600).round();
}

int? _runningSeconds(
  CrmJobExecution job,
  int? startTimeSeconds, {
  DateTime? now,
}) {
  final exactStart = DateTime.tryParse(job.startTime)?.toLocal();
  if (exactStart != null) {
    final seconds = (now ?? DateTime.now()).difference(exactStart).inSeconds;
    return seconds < 0 ? 0 : seconds;
  }
  if (startTimeSeconds == null) return null;
  final date = DateTime.tryParse(job.date ?? '');
  final startedAt = date == null
      ? job.createdAt.toLocal()
      : DateTime(
          date.year,
          date.month,
          date.day,
          startTimeSeconds ~/ 3600,
          (startTimeSeconds % 3600) ~/ 60,
          startTimeSeconds % 60,
        );
  final seconds = (now ?? DateTime.now()).difference(startedAt).inSeconds;
  return seconds < 0 ? 0 : seconds;
}

int? _secondsFromTime(String? value) {
  if (value == null) return null;
  final match = RegExp(r'^(\d{1,2}):(\d{2}):(\d{2})').firstMatch(value);
  if (match == null) return null;
  final hours = int.parse(match.group(1)!);
  final minutes = int.parse(match.group(2)!);
  final seconds = int.parse(match.group(3)!);
  if (hours > 23 || minutes > 59 || seconds > 59) return null;
  return hours * 3600 + minutes * 60 + seconds;
}
