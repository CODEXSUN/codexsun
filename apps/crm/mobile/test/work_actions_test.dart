import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:geolocator/geolocator.dart';
import 'package:codexsun_crm_mobile/core/api/crm_mobile_api.dart';
import 'package:codexsun_crm_mobile/features/dashboard/work_action_sheet.dart';

const session = UserSession(
  accessToken: 'test-token',
  profile: UserProfile(
    email: 'field@example.test',
    name: 'Field user',
    role: 'user',
  ),
);

class FakeActionsApi extends CrmMobileApi {
  FakeActionsApi() : super('http://localhost');
  final List<Map<String, dynamic>> reports = [];
  final List<String> comments = [];
  var starts = 0;
  var stops = 0;
  bool failCheckIn = false;

  @override
  Future<void> sendWorkReport(
    String accessToken,
    Map<String, dynamic> payload,
  ) async {
    reports.add(Map.from(payload));
    if (failCheckIn) throw const CrmMobileApiException('Try again');
  }

  @override
  Future<void> addTaskComment(
    String accessToken,
    int id,
    String comment,
  ) async {
    comments.add(comment);
  }

  @override
  Future<void> startTaskJob(String token, int id) async {
    starts++;
  }

  @override
  Future<void> stopTaskJob(String token, int id) async {
    stops++;
  }
}

Position samplePosition() => Position(
  latitude: 13.0827,
  longitude: 80.2707,
  timestamp: DateTime.utc(2026, 10, 17),
  accuracy: 8,
  altitude: 0,
  altitudeAccuracy: 0,
  heading: 0,
  headingAccuracy: 0,
  speed: 0,
  speedAccuracy: 0,
);

void main() {
  testWidgets('check-in waits for submit and displays captured location', (
    tester,
  ) async {
    final api = FakeActionsApi();
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: WorkActionSheet(
            api: api,
            session: session,
            taskId: 4,
            capturePosition: () async => samplePosition(),
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Actions'), findsOneWidget);
    expect(find.text('Comment'), findsOneWidget);
    expect(find.text('Write a comment…'), findsNothing);
    expect(find.text('Check in'), findsOneWidget);
    expect(find.text('Start Job'), findsOneWidget);
    expect(find.text('Report actions'), findsNothing);
    expect(find.text('Log location'), findsNothing);
    expect(find.text('Charges'), findsNothing);
    expect(find.text('Collected Rs.'), findsNothing);

    await tester.tap(find.text('Check in'));
    await tester.pumpAndSettle();
    expect(find.text('Actions'), findsOneWidget);
    expect(find.text('Captured location'), findsOneWidget);
    expect(find.text('GPS: 13.0827, 80.2707'), findsOneWidget);
    expect(find.text('Accuracy: 8.0 m'), findsOneWidget);
    expect(
      find.byKey(const ValueKey('work-action-check-in-input')),
      findsOneWidget,
    );
    expect(find.text('Submit'), findsOneWidget);
    expect(api.reports, isEmpty);

    await tester.enterText(
      find.byKey(const ValueKey('work-action-check-in-input')),
      'Arrived at customer site.',
    );
    await tester.tap(find.byKey(const ValueKey('work-action-check-in-submit')));
    await tester.pumpAndSettle();
    expect(find.text('Actions'), findsNothing);
    expect(api.reports.single['action'], 'check-in');
    expect(api.reports.single['latitude'], 13.0827);
    expect(api.reports.single['body'], 'Arrived at customer site.');
    expect(api.reports.single['amount'], isNull);
  });

  testWidgets('check-out also waits for submit with captured location', (
    tester,
  ) async {
    final api = FakeActionsApi();
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: WorkActionSheet(
            api: api,
            session: session,
            taskId: 4,
            checkedIn: true,
            capturePosition: () async => samplePosition(),
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    await tester.tap(find.text('Check out'));
    await tester.pumpAndSettle();
    expect(find.text('GPS: 13.0827, 80.2707'), findsOneWidget);
    expect(api.reports, isEmpty);

    await tester.tap(find.byKey(const ValueKey('work-action-check-in-submit')));
    await tester.pumpAndSettle();
    expect(api.reports.single['action'], 'check-out');
    expect(api.reports.single['latitude'], 13.0827);
    expect(find.text('Actions'), findsNothing);
  });

  testWidgets('comment submit closes the composer and action list', (
    tester,
  ) async {
    final api = FakeActionsApi();
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: WorkActionSheet(api: api, session: session, taskId: 7),
        ),
      ),
    );
    await tester.pumpAndSettle();

    await tester.tap(find.byKey(const ValueKey('work-action-comment')));
    await tester.pumpAndSettle();
    await tester.enterText(
      find.byKey(const ValueKey('work-action-comment-input')),
      'Work is underway.',
    );
    await tester.pumpAndSettle();
    expect(find.text('Submit'), findsOneWidget);
    await tester.tap(find.byKey(const ValueKey('work-action-comment-submit')));
    await tester.pumpAndSettle();
    expect(api.comments, ['Work is underway.']);
    expect(api.reports, isEmpty);
    expect(find.text('Actions'), findsNothing);
    expect(find.text('Submit'), findsNothing);
  });

  testWidgets('starting a job closes the action list after success', (
    tester,
  ) async {
    final api = FakeActionsApi();
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: WorkActionSheet(api: api, session: session, taskId: 7),
        ),
      ),
    );
    await tester.pumpAndSettle();
    await tester.tap(find.text('Start Job'));
    await tester.pumpAndSettle();
    expect(api.starts, 1);
    expect(find.text('Actions'), findsNothing);
  });

  testWidgets(
    'running timer is shown on Stop Job and Mark Complete has no description',
    (tester) async {
      final api = FakeActionsApi();
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: WorkActionSheet(
              api: api,
              session: session,
              taskId: 7,
              isJobRunning: true,
              jobStartedAt: DateTime.now().subtract(
                const Duration(seconds: 56),
              ),
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Stop Job'), findsOneWidget);
      final timerText = find.descendant(
        of: find.byKey(const ValueKey('work-action-running-timer')),
        matching: find.byType(Text),
      );
      final initialTimer = tester.widget<Text>(timerText).data!;
      expect(initialTimer, matches(RegExp(r'^00:00:5[6-9]$')));
      expect(find.text('Mark Complete'), findsOneWidget);
      expect(find.text('Write a note on this record.'), findsNothing);
      expect(find.text('Record your arrival with location.'), findsNothing);
      expect(find.text('Stop the running job timer.'), findsNothing);
      await tester.pumpWidget(const SizedBox.shrink());
    },
  );

  testWidgets('check-in keeps the retry key after a failed send', (
    tester,
  ) async {
    final api = FakeActionsApi()..failCheckIn = true;
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: WorkActionSheet(
            api: api,
            session: session,
            taskId: 9,
            capturePosition: () async => samplePosition(),
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();
    await tester.tap(find.text('Check in'));
    await tester.pumpAndSettle();
    expect(api.reports, isEmpty);
    await tester.enterText(
      find.byKey(const ValueKey('work-action-check-in-input')),
      'Retry note',
    );
    await tester.tap(find.byKey(const ValueKey('work-action-check-in-submit')));
    await tester.pumpAndSettle();
    expect(find.text('Try again'), findsOneWidget);
    await tester.tap(find.text('Check in'));
    await tester.pumpAndSettle();
    expect(
      tester
          .widget<TextField>(
            find.byKey(const ValueKey('work-action-check-in-input')),
          )
          .controller!
          .text,
      'Retry note',
    );
    await tester.tap(find.byKey(const ValueKey('work-action-check-in-submit')));
    await tester.pumpAndSettle();
    expect(api.reports, hasLength(2));
    expect(api.reports[0]['requestId'], api.reports[1]['requestId']);
    expect(find.text('Check out'), findsNothing);
  });
}
