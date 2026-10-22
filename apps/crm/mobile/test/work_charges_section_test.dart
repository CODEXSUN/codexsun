import 'package:codexsun_crm_mobile/core/api/crm_mobile_api.dart';
import 'package:codexsun_crm_mobile/features/dashboard/work_charges_section.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

const _session = UserSession(
  accessToken: 'test-token',
  profile: UserProfile(
    email: 'field@example.test',
    name: 'Field user',
    role: 'user',
  ),
);

class _ChargesApi extends CrmMobileApi {
  _ChargesApi() : super('http://localhost');

  final rows = <Map<String, dynamic>>[
    {
      'uuid': 'charge-1',
      'action': 'charge',
      'amount': '150.00',
      'body': 'Service visit',
      'created_by': 'office@example.test',
      'created_at': '2026-10-22T10:00:00Z',
    },
  ];
  Map<String, dynamic>? submitted;
  int? requestedEnquiryId;
  int? requestedTaskId;

  @override
  Future<Map<String, dynamic>> workCharges(
    String accessToken, {
    int? enquiryId,
    int? taskId,
    int page = 1,
  }) async {
    requestedEnquiryId = enquiryId;
    requestedTaskId = taskId;
    return {
      'items': rows,
      'total': rows.length,
      'amounts': {
        'charges': 150,
        'collections': submitted == null ? 0 : submitted!['amount'],
      },
    };
  }

  @override
  Future<void> sendWorkReport(
    String accessToken,
    Map<String, dynamic> payload,
  ) async {
    submitted = payload;
    rows.insert(0, {
      'uuid': 'collection-1',
      'action': 'collection',
      'amount': payload['amount'],
      'body': payload['body'],
      'created_by': 'field@example.test',
      'created_at': '2026-10-22T11:00:00Z',
    });
  }
}

void main() {
  for (final target in ['enquiry', 'task']) {
    testWidgets('shows web charge and records $target collection with notes', (
      tester,
    ) async {
      final api = _ChargesApi();
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: WorkChargesSection(
              api: api,
              session: _session,
              enquiryId: target == 'enquiry' ? 41 : null,
              taskId: target == 'task' ? 42 : null,
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();
      expect(find.text('Charge initiated · ₹150.00'), findsOneWidget);
      expect(find.text('Collection pending'), findsOneWidget);
      expect(find.textContaining('Service visit'), findsOneWidget);
      await tester.tap(find.byKey(const ValueKey('charge-row-charge-1')));
      await tester.pumpAndSettle();
      expect(find.text('Record collection'), findsOneWidget);
      await tester.enterText(
        find.byKey(const ValueKey('collection-amount')),
        '40.50',
      );
      await tester.tap(find.text('Confirm collection'));
      await tester.pumpAndSettle();
      expect(
        find.text('Enter collection notes before confirming.'),
        findsOneWidget,
      );
      expect(api.submitted, isNull);
      await tester.enterText(
        find.byKey(const ValueKey('collection-notes')),
        'Cash received',
      );
      await tester.tap(find.text('Confirm collection'));
      await tester.pumpAndSettle();
      expect(api.requestedEnquiryId, target == 'enquiry' ? 41 : null);
      expect(api.requestedTaskId, target == 'task' ? 42 : null);
      expect(api.submitted, containsPair('action', 'collection'));
      expect(api.submitted, containsPair('amount', 40.5));
      expect(api.submitted, containsPair('body', 'Cash received'));
      expect(find.text('Collected · ₹40.50'), findsOneWidget);
      expect(find.text('Outstanding ₹109.50'), findsOneWidget);
    });
  }

  testWidgets('clears the pending intent after full collection', (
    tester,
  ) async {
    final api = _ChargesApi()..submitted = {'amount': 150};
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: WorkChargesSection(api: api, session: _session, enquiryId: 41),
        ),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.text('Outstanding ₹0.00'), findsOneWidget);
    expect(find.text('Collection pending'), findsNothing);
    expect(find.text('Collect'), findsNothing);
  });
}
