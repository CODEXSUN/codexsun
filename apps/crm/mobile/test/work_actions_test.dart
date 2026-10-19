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
  testWidgets('actions match web controls and check-in toggles to check-out', (
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
    expect(find.text('Write a comment…'), findsOneWidget);
    expect(find.text('Comment'), findsOneWidget);
    expect(find.text('Check in'), findsOneWidget);
    expect(find.text('Start job'), findsOneWidget);
    expect(find.text('Report actions'), findsNothing);
    expect(find.text('Log location'), findsNothing);
    expect(find.text('Charges'), findsNothing);
    expect(find.text('Collected Rs.'), findsNothing);

    await tester.tap(find.text('Check in'));
    await tester.pumpAndSettle();
    expect(find.text('Check out'), findsOneWidget);
    expect(api.reports.single['action'], 'check-in');
    expect(api.reports.single['latitude'], 13.0827);
    expect(api.reports.single['amount'], isNull);
  });

  testWidgets(
    'comments use the task comment endpoint and job toggle shows timer',
    (tester) async {
      final api = FakeActionsApi();
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: WorkActionSheet(api: api, session: session, taskId: 7),
          ),
        ),
      );
      await tester.pumpAndSettle();

      await tester.enterText(find.byType(TextField).first, 'Work is underway.');
      await tester.tap(find.text('Comment'));
      await tester.pumpAndSettle();
      expect(api.comments, ['Work is underway.']);
      expect(api.reports, isEmpty);

      await tester.tap(find.text('Start job'));
      await tester.pump();
      expect(api.starts, 1);
      expect(find.textContaining('Job running ·'), findsOneWidget);
      expect(find.text('Stop job'), findsOneWidget);

      await tester.tap(find.text('Stop job'));
      await tester.pumpAndSettle();
      expect(api.stops, 1);
      expect(find.textContaining('Job running ·'), findsNothing);
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
    expect(find.text('Try again'), findsOneWidget);
    await tester.tap(find.text('Check in'));
    await tester.pumpAndSettle();
    expect(api.reports, hasLength(2));
    expect(api.reports[0]['requestId'], api.reports[1]['requestId']);
    expect(find.text('Check out'), findsNothing);
  });
}
