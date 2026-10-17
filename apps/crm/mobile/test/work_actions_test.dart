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
  final List<Map<String, dynamic>> saved = [];
  bool fail = false;
  @override
  Future<void> sendWorkReport(
    String accessToken,
    Map<String, dynamic> payload,
  ) async {
    saved.add(Map.from(payload));
    if (fail) throw const CrmMobileApiException('Try again');
  }
}

Future<void> selectAction(WidgetTester tester, String label) async {
  await tester.tap(find.byType(DropdownButtonFormField<String>).first);
  await tester.pumpAndSettle();
  await tester.ensureVisible(find.text(label).last);
  await tester.tap(find.text(label).last);
  await tester.pumpAndSettle();
}

void main() {
  testWidgets(
    'task drawer confirms GPS actions and retains retry identity on failure',
    (tester) async {
      final api = FakeActionsApi();
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: WorkActionSheet(
              api: api,
              session: session,
              taskId: 4,
              capturePosition: () async => Position(
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
              ),
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();
      await selectAction(tester, 'Check in');
      expect(api.saved, isEmpty);
      api.fail = true;
      await tester.tap(find.text('Confirm'));
      await tester.pumpAndSettle();
      expect(find.text('Try again'), findsOneWidget);
      await tester.tap(find.text('Confirm'));
      await tester.pumpAndSettle();
      expect(api.saved.length, 2);
      expect(api.saved[0]['requestId'], api.saved[1]['requestId']);
      expect(api.saved.last['latitude'], 13.0827);
      expect(api.saved.last['longitude'], 80.2707);
      expect(api.saved.last['taskId'], 4);
      expect(api.saved.last['enquiryId'], isNull);
    },
  );
  testWidgets('drawer validates notes and GPS errors before syncing', (
    tester,
  ) async {
    final api = FakeActionsApi();
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: WorkActionSheet(
            api: api,
            session: session,
            taskId: 7,
            capturePosition: () async => throw Exception('Location denied'),
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();
    await tester.tap(find.text('Confirm'));
    await tester.pumpAndSettle();
    expect(find.text('Enter the actions taken.'), findsOneWidget);
    expect(api.saved, isEmpty);
    await selectAction(tester, 'Check in');
    await tester.tap(find.text('Confirm'));
    await tester.pumpAndSettle();
    expect(api.saved, isEmpty);
    expect(find.textContaining('Location denied'), findsOneWidget);
  });
}
