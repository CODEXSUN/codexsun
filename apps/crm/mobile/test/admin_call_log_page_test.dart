import 'package:codexsun_crm_mobile/core/api/crm_mobile_api.dart';
import 'package:codexsun_crm_mobile/features/dashboard/admin_call_log_page.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  const channel = MethodChannel('in.codexsun.crm_app/mobile-actions');

  setUp(() {
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(channel, (call) async {
          if (call.method == 'hasCallLogAccess') return true;
          if (call.method == 'callLogs') {
            return [
              {
                'name': 'Customer with a long saved name',
                'number': '+91 9655223344',
                'type': 2,
                'timestamp': DateTime(
                  2026,
                  8,
                  22,
                  22,
                  11,
                ).millisecondsSinceEpoch,
                'durationSeconds': 63,
              },
            ];
          }
          return false;
        });
  });

  tearDown(() {
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(channel, null);
  });

  testWidgets('call log card keeps details and actions inside narrow screens', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(320, 800);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    await tester.pumpWidget(
      MaterialApp(
        home: AdminCallLogPage(
          api: CrmMobileApi('http://localhost'),
          session: const UserSession(
            accessToken: 'test-token',
            profile: UserProfile(
              email: 'admin@example.test',
              name: 'Admin',
              role: 'admin',
            ),
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Customer with a long saved name'), findsOneWidget);
    expect(find.byTooltip('Sync this call to CRM'), findsOneWidget);
    expect(
      find.byTooltip('Create enquiry for Customer with a long saved name'),
      findsOneWidget,
    );
    expect(
      find.byTooltip('Call Customer with a long saved name'),
      findsOneWidget,
    );
    expect(tester.takeException(), isNull);

    final card = tester.getRect(find.byType(Card).last);
    for (final tooltip in [
      'Sync this call to CRM',
      'Create enquiry for Customer with a long saved name',
      'Call Customer with a long saved name',
    ]) {
      expect(
        card.contains(tester.getRect(find.byTooltip(tooltip)).center),
        isTrue,
      );
    }
  });
}
