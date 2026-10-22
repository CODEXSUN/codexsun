import 'package:flutter_test/flutter_test.dart';

import 'package:codexsun_crm_mobile/features/dashboard/work_timestamp_format.dart';

void main() {
  test('formats ISO timestamps in local 12-hour date and time format', () {
    final expected = formatWorkDateTime(
      DateTime.parse('2026-10-22T08:49:17.000Z'),
    );

    final result = formatWorkTimestamps('Started @ 2026-10-22T08:49:17.000Z');

    expect(result, 'Started @ $expected');
    expect(result, isNot(contains('T08:49:17')));
    expect(
      result,
      matches(r'^Started @ \d{2}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} (am|pm)$'),
    );
  });

  test('formats device date strings and removes timezone suffixes', () {
    expect(
      formatWorkTimestamps(
        'Captured: Thu Oct 22 2026 14:12:30 GMT+0530 (India Standard Time)',
      ),
      'Captured: ${formatWorkDateTime(DateTime(2026, 10, 22, 14, 12, 30))}',
    );
  });

  test('formats all timestamps in a completed job cycle', () {
    final result = formatWorkTimestamps(
      'Job #7 completed\n'
      'Started @ 2026-10-22T08:49:17.000Z\n'
      'Completed @ 2026-10-22T08:49:26.125Z\n'
      'Duration: 00:00:09',
    );

    expect(
      result,
      contains(
        'Started @ ${formatWorkDateTime(DateTime.parse('2026-10-22T08:49:17Z'))}',
      ),
    );
    expect(
      result,
      contains(
        'Completed @ ${formatWorkDateTime(DateTime.parse('2026-10-22T08:49:26.125Z'))}',
      ),
    );
    expect(result, contains('Duration: 00:00:09'));
    expect(result, isNot(contains('2026-10-22T')));
  });
}
