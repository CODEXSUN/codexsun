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
  final schedules = <Map<String, dynamic>>[];
  String? enquiryStageId;
  int? taskStageId;
  double chargeOutstanding = 0;
  int? chargeEnquiryId;
  int? chargeTaskId;

  @override
  Future<Map<String, dynamic>> workCharges(
    String accessToken, {
    int? enquiryId,
    int? taskId,
    int page = 1,
  }) async {
    chargeEnquiryId = enquiryId;
    chargeTaskId = taskId;
    return {
      'items': const [],
      'total': 0,
      'amounts': {'charges': chargeOutstanding, 'collections': 0},
    };
  }

  static final enquiry = CrmJob(
    id: 41,
    sourceId: '41',
    number: '41',
    title: 'Mobile service request',
    customer: 'Customer',
    list: 'Office',
    dueDate: '',
    createdBy: 'field@example.test',
    createdAt: DateTime.utc(2026, 10, 22),
    lastAction: '',
    status: 'New',
    statusId: '1',
    priority: 'Normal',
    comments: [],
    jobs: [],
    activities: [],
  );

  @override
  Future<CrmJob> updateProperties({
    required String accessToken,
    required String id,
    String? statusId,
    String? priorityId,
    String? listInId,
    String? assignedUserId,
    String? dueDate,
    String? closedReason,
  }) async {
    enquiryStageId = statusId;
    return enquiry;
  }

  @override
  Future<Map<String, dynamic>> taskOptions(String accessToken) async => {
    'statuses': [
      {'id': 1, 'name': 'New', 'code': 'new'},
      {'id': 2, 'name': 'Open', 'code': 'open'},
      {'id': 3, 'name': 'Won', 'code': 'won'},
      {'id': 4, 'name': 'Lost', 'code': 'lost'},
      {'id': 5, 'name': 'Hold for Approval', 'code': 'hold-for-approval'},
      {'id': 6, 'name': 'Long Hold', 'code': 'long-hold'},
      {'id': 7, 'name': 'Hold for Spares', 'code': 'hold-for-spares'},
      {'id': 8, 'name': 'Closed', 'code': 'closed'},
      {'id': 9, 'name': 'Re-open', 'code': 're-open'},
    ],
  };

  @override
  Future<CrmCallEnquiryFormData> callEnquiryFormData(
    String accessToken,
  ) async => const CrmCallEnquiryFormData(
    groups: [],
    assignees: [],
    statuses: [
      CrmCallEnquiryStatus(id: '1', name: 'New', code: 'new'),
      CrmCallEnquiryStatus(id: '2', name: 'Open', code: 'open'),
      CrmCallEnquiryStatus(id: '3', name: 'Won', code: 'won'),
      CrmCallEnquiryStatus(id: '4', name: 'Lost', code: 'lost'),
      CrmCallEnquiryStatus(
        id: '5',
        name: 'Hold for Approval',
        code: 'hold-for-approval',
      ),
      CrmCallEnquiryStatus(id: '6', name: 'Long Hold', code: 'long-hold'),
      CrmCallEnquiryStatus(
        id: '7',
        name: 'Hold for Spares',
        code: 'hold-for-spares',
      ),
      CrmCallEnquiryStatus(id: '8', name: 'Closed', code: 'closed'),
      CrmCallEnquiryStatus(id: '9', name: 'Re-open', code: 're-open'),
    ],
  );

  @override
  Future<void> createSchedule({
    required String accessToken,
    required String notes,
    required String sourceType,
    required int sourceId,
    required DateTime scheduledAt,
  }) async {
    schedules.add({
      'notes': notes,
      'sourceType': sourceType,
      'sourceId': sourceId,
      'scheduledAt': scheduledAt,
    });
  }

  @override
  Future<Map<String, dynamic>> updateTaskProperties({
    required String accessToken,
    required int id,
    required int statusId,
  }) async {
    taskStageId = statusId;
    return {'id': id, 'statusId': statusId};
  }

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
  for (final target in ['enquiry', 'task']) {
    testWidgets('Collect charge action submits $target collection with notes', (
      tester,
    ) async {
      final api = FakeActionsApi()..chargeOutstanding = 150;
      var savedCount = 0;
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: WorkActionSheet(
              api: api,
              session: session,
              enquiries: target == 'enquiry'
                  ? [FakeActionsApi.enquiry]
                  : const [],
              taskId: target == 'task' ? 4 : null,
              onCollectionSaved: () => savedCount++,
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();
      await tester.tap(
        find.byKey(const ValueKey('work-action-collect-charge')),
      );
      await tester.pumpAndSettle();
      expect(find.text('Record collection'), findsOneWidget);
      expect(api.chargeEnquiryId, target == 'enquiry' ? 41 : null);
      expect(api.chargeTaskId, target == 'task' ? 4 : null);
      await tester.enterText(
        find.byKey(const ValueKey('collection-amount')),
        '75',
      );
      await tester.enterText(
        find.byKey(const ValueKey('collection-notes')),
        'Received by card',
      );
      await tester.tap(find.text('Confirm collection'));
      await tester.pumpAndSettle();
      expect(api.reports.single, containsPair('action', 'collection'));
      expect(api.reports.single, containsPair('amount', 75.0));
      expect(api.reports.single, containsPair('body', 'Received by card'));
      expect(savedCount, 1);
    });
  }

  testWidgets('Collect charge action warns when nothing is outstanding', (
    tester,
  ) async {
    final api = FakeActionsApi();
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: WorkActionSheet(api: api, session: session, taskId: 4),
        ),
      ),
    );
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const ValueKey('work-action-collect-charge')));
    await tester.pumpAndSettle();
    expect(find.text('No charges are awaiting collection.'), findsOneWidget);
    expect(find.text('Record collection'), findsNothing);
  });

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

  testWidgets('schedule action submits a dated enquiry schedule', (
    tester,
  ) async {
    final api = FakeActionsApi();
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: WorkActionSheet(
            api: api,
            session: session,
            enquiries: [FakeActionsApi.enquiry],
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const ValueKey('work-action-schedule')));
    await tester.pumpAndSettle();
    expect(find.text('Schedule').last, findsOneWidget);
    expect(
      find.byKey(const ValueKey('work-action-schedule-date')),
      findsOneWidget,
    );
    await tester.tap(find.byKey(const ValueKey('work-action-schedule-time')));
    await tester.pumpAndSettle();
    expect(find.byType(TimePickerDialog), findsOneWidget);
    await tester.tap(find.byIcon(Icons.keyboard_outlined));
    await tester.pumpAndSettle();
    final timeFields = find.descendant(
      of: find.byType(TimePickerDialog),
      matching: find.byType(TextField),
    );
    await tester.enterText(timeFields.first, '10');
    await tester.enterText(timeFields.last, '30');
    await tester.pumpAndSettle();
    await tester.tap(find.text('OK'));
    await tester.pumpAndSettle();
    await tester.enterText(
      find.byKey(const ValueKey('work-action-schedule-notes')),
      'Call customer and confirm delivery time',
    );
    await tester.tap(find.byKey(const ValueKey('work-action-schedule-submit')));
    await tester.pumpAndSettle();

    expect(api.schedules, hasLength(1));
    expect(api.schedules.single['sourceType'], 'enquiry');
    expect(api.schedules.single['sourceId'], 41);
    expect(
      api.schedules.single['notes'],
      'Call customer and confirm delivery time',
    );
    expect(api.schedules.single['scheduledAt'], isA<DateTime>());
    final scheduledAt = api.schedules.single['scheduledAt'] as DateTime;
    expect(scheduledAt.hour % 12, 10);
    expect(scheduledAt.minute, 30);
    expect(find.text('Actions'), findsNothing);
  });

  testWidgets('task schedule action submits through the CRM API', (
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
            taskStatusId: '1',
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const ValueKey('work-action-schedule')));
    await tester.pumpAndSettle();
    await tester.enterText(
      find.byKey(const ValueKey('work-action-schedule-notes')),
      'Prepare visit',
    );
    await tester.tap(find.byKey(const ValueKey('work-action-schedule-submit')));
    await tester.pumpAndSettle();
    expect(api.schedules.single['sourceType'], 'task');
    expect(api.schedules.single['sourceId'], 7);
    expect(find.text('Actions'), findsNothing);
  });

  testWidgets('task Change Stage submits the selected lookup value', (
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
            taskStatusId: '1',
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const ValueKey('work-action-change-stage')));
    await tester.pumpAndSettle();
    await tester.enterText(
      find.byKey(const ValueKey('work-action-stage-lookup')),
      'Open',
    );
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const ValueKey('work-action-stage-option-2')));
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const ValueKey('work-action-stage-submit')));
    await tester.pumpAndSettle();

    expect(api.taskStageId, 2);
    expect(find.text('Actions'), findsNothing);
  });

  testWidgets('task Change Stage shows every available non-closed status', (
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
            taskStatusId: '1',
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const ValueKey('work-action-change-stage')));
    await tester.pumpAndSettle();
    final stageSheet = tester.getSize(
      find.byKey(const ValueKey('work-action-stage-sheet')),
    );
    final viewportHeight =
        tester.view.physicalSize.height / tester.view.devicePixelRatio;
    expect(stageSheet.height, greaterThan(viewportHeight * .68));
    expect(stageSheet.height, lessThan(viewportHeight * .8));
    await tester.tap(find.byKey(const ValueKey('work-action-stage-lookup')));
    await tester.pumpAndSettle();
    final optionScrollbar = tester.widget<Scrollbar>(find.byType(Scrollbar));
    expect(optionScrollbar.thumbVisibility, isTrue);
    expect(optionScrollbar.trackVisibility, isTrue);
    expect(
      find.byKey(const ValueKey('work-action-stage-option-1')),
      findsOneWidget,
    );
    expect(
      tester
          .widget<Icon>(find.byKey(const ValueKey('work-action-stage-color-1')))
          .color,
      const Color(0xFF2563EB),
    );
    expect(
      tester
          .widget<Icon>(
            find.byKey(const ValueKey('work-action-stage-selected-1')),
          )
          .color,
      const Color(0xFF2563EB),
    );
    expect(
      tester
          .widget<Icon>(find.byKey(const ValueKey('work-action-stage-color-2')))
          .color,
      const Color(0xFF0EA5E9),
    );
    expect(
      tester
          .widget<Icon>(find.byKey(const ValueKey('work-action-stage-color-3')))
          .color,
      const Color(0xFF10B981),
    );
    expect(
      tester
          .widget<Icon>(find.byKey(const ValueKey('work-action-stage-color-4')))
          .color,
      const Color(0xFFDC2626),
    );
    expect(
      tester
          .widget<Icon>(find.byKey(const ValueKey('work-action-stage-color-5')))
          .color,
      const Color(0xFFF59E0B),
    );
    await tester.scrollUntilVisible(
      find.byKey(const ValueKey('work-action-stage-option-7')),
      100,
      scrollable: find.byType(Scrollable).last,
    );
    expect(
      find.byKey(const ValueKey('work-action-stage-option-7')),
      findsOneWidget,
    );
    expect(
      tester
          .widget<Icon>(find.byKey(const ValueKey('work-action-stage-color-6')))
          .color,
      const Color(0xFF7C3AED),
    );
    expect(
      tester
          .widget<Icon>(find.byKey(const ValueKey('work-action-stage-color-7')))
          .color,
      const Color(0xFFF97316),
    );

    await tester.enterText(
      find.byKey(const ValueKey('work-action-stage-lookup')),
      'Closed',
    );
    await tester.pumpAndSettle();
    expect(
      find.byKey(const ValueKey('work-action-stage-option-8')),
      findsNothing,
    );
    await tester.enterText(
      find.byKey(const ValueKey('work-action-stage-lookup')),
      'Re-open',
    );
    await tester.pumpAndSettle();
    expect(
      find.byKey(const ValueKey('work-action-stage-option-9')),
      findsNothing,
    );
  });

  testWidgets('enquiry Change Stage uses the searchable status lookup', (
    tester,
  ) async {
    final api = FakeActionsApi();
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: WorkActionSheet(
            api: api,
            session: session,
            enquiries: [FakeActionsApi.enquiry],
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const ValueKey('work-action-change-stage')));
    await tester.pumpAndSettle();
    await tester.enterText(
      find.byKey(const ValueKey('work-action-stage-lookup')),
      'Open',
    );
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const ValueKey('work-action-stage-option-2')));
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const ValueKey('work-action-stage-submit')));
    await tester.pumpAndSettle();

    expect(api.enquiryStageId, '2');
    expect(find.text('Actions'), findsNothing);
  });

  testWidgets('enquiry Change Stage omits Closed and Re-open', (tester) async {
    final api = FakeActionsApi();
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: WorkActionSheet(
            api: api,
            session: session,
            enquiries: [FakeActionsApi.enquiry],
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const ValueKey('work-action-change-stage')));
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const ValueKey('work-action-stage-lookup')));
    await tester.pumpAndSettle();
    expect(
      find.byKey(const ValueKey('work-action-stage-option-1')),
      findsOneWidget,
    );
    await tester.scrollUntilVisible(
      find.byKey(const ValueKey('work-action-stage-option-7')),
      100,
      scrollable: find.byType(Scrollable).last,
    );
    expect(
      find.byKey(const ValueKey('work-action-stage-option-7')),
      findsOneWidget,
    );

    await tester.enterText(
      find.byKey(const ValueKey('work-action-stage-lookup')),
      'Closed',
    );
    await tester.pumpAndSettle();
    expect(
      find.byKey(const ValueKey('work-action-stage-option-8')),
      findsNothing,
    );
    await tester.enterText(
      find.byKey(const ValueKey('work-action-stage-lookup')),
      'Re-open',
    );
    await tester.pumpAndSettle();
    expect(
      find.byKey(const ValueKey('work-action-stage-option-9')),
      findsNothing,
    );
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
