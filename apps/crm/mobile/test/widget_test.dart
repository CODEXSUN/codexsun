import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:geolocator/geolocator.dart';

import 'package:codexsun_crm_mobile/core/api/crm_mobile_api.dart';
import 'package:codexsun_crm_mobile/core/auth/secure_session_store.dart';
import 'package:codexsun_crm_mobile/core/update/app_update_service.dart';
import 'package:codexsun_crm_mobile/app/app_footer_dock.dart';
import 'package:codexsun_crm_mobile/app/dashboard_navigation.dart';
import 'package:codexsun_crm_mobile/features/auth/login_page.dart';
import 'package:codexsun_crm_mobile/features/auth/pin_auth_pages.dart';
import 'package:codexsun_crm_mobile/features/dashboard/dashboard_list_page.dart';
import 'package:codexsun_crm_mobile/features/dashboard/dashboard_jobs_feed.dart';
import 'package:codexsun_crm_mobile/features/dashboard/dashboard_page.dart';
import 'package:codexsun_crm_mobile/features/dashboard/job_detail_page.dart';
import 'package:codexsun_crm_mobile/features/dashboard/job_duration.dart';
import 'package:codexsun_crm_mobile/features/dashboard/messages_sample_page.dart';
import 'package:codexsun_crm_mobile/features/dashboard/my_enquiries_page.dart';

void main() {
  test('uses the local development host for Android emulator API calls', () {
    expect(CrmMobileApi('http://10.0.2.2:7010').hostHeader, '127.0.0.1:7010');
    expect(CrmMobileApi('https://crm.example.com').hostHeader, isNull);
  });

  test('resets the session after ten inactive days', () {
    final store = SecureSessionStore();
    final current = StoredSession(
      accessToken: 'token',
      email: 'user@example.com',
      lastActivityAt: DateTime.now().toUtc().subtract(const Duration(days: 9)),
      biometricEnabled: false,
    );
    final expired = StoredSession(
      accessToken: 'token',
      email: 'user@example.com',
      lastActivityAt: DateTime.now().toUtc().subtract(const Duration(days: 11)),
      biometricEnabled: false,
    );

    expect(store.isActive(current), isTrue);
    expect(store.isActive(expired), isFalse);
  });

  test('compares app update versions safely', () {
    expect(isNewerVersion('1.0.2', '1.0.1'), isTrue);
    expect(isNewerVersion('1.0.1', '1.0.1'), isFalse);
    expect(isNewerVersion('1.0.0', '1.0.1'), isFalse);
  });

  test('rejects an HTML update response without crashing', () {
    expect(
      () => AppRelease.fromJson({'versionName': '<!doctype html>'}),
      throwsA(isA<AppUpdateException>()),
    );
  });

  test('uses the other member as a direct conversation title', () {
    final conversation = MessagingConversation.fromJson({
      'id': 44,
      'members': [
        {'email': 'vijay@example.com', 'userName': 'Vijay'},
        {'email': 'meera@example.com', 'userName': 'Meera'},
      ],
      'updatedAt': '2026-09-02T10:00:00.000Z',
    }, 'vijay@example.com');

    expect(conversation.title, 'Meera');
  });

  test('converts rich-text comments to readable mobile text', () {
    final comment = CrmComment.fromJson({
      'id': 'message-1',
      'comment':
          '<p>Test &amp; verify</p><p>Second&nbsp;line<br>Done &#x2713;</p>',
      'createdAt': '2026-08-03T11:42:00.000Z',
      'createdByUserId': 'vijay@example.com',
    });

    expect(comment.comment, 'Test & verify\nSecond line\nDone ✓');
  });

  test('maps enquiry location coordinates and capture time', () {
    final location = CrmEnquiryLocation.fromJson({
      'id': 5,
      'latitude': 13.0827,
      'longitude': 80.2707,
      'accuracyMeters': 8.5,
      'capturedAt': '2026-10-14T12:00:00.000Z',
      'createdBy': 'worker@example.com',
    });

    expect(location.latitude, 13.0827);
    expect(location.longitude, 80.2707);
    expect(location.accuracyMeters, 8.5);
    expect(location.capturedAt.toUtc(), DateTime.utc(2026, 10, 14, 12));
  });

  test('maps CRM job executions and enquiry activities', () {
    final job = CrmJob.fromJson({
      'id': 762,
      'messages': <Object>[],
      'jobs': [
        {
          'name': 'JOBEXE3',
          'employee': 'HR-EMP-00001',
          'createdAt': '2026-08-03T09:17:45.000Z',
          'startTime': '14:47:45',
          'stopTime': '14:48:12',
          'hours': 0.01,
          'employeeCostPerHour': 0,
          'totalCost': 0,
          'status': 'Completed',
        },
      ],
      'activities': [
        {
          'uuid': 'activity-1',
          'action': 'changed',
          'details': 'Vijay changed Status',
          'createdAt': '2026-08-03T09:18:12.000Z',
        },
      ],
    });

    expect(job.jobs.single.name, 'JOBEXE3');
    expect(job.jobs.single.status, 'Completed');
    expect(job.activities.single.details, 'Vijay changed Status');
  });

  test('maps CODEXSUN CRM enquiry records and work jobs', () {
    final enquiry = CrmJob.fromJson({
      'id': '35',
      'enquiryNo': '1807',
      'title': 'Core replacement',
      'description': 'Discuss the replacement options.',
      'capturedName': 'Acme Ltd',
      'capturedPhone': '9876543210',
      'listIn': 'Accounts',
      'dueDate': '2026-10-30',
      'createdBy': 'Maya',
      'createdAt': '2026-10-12T08:15:00.000Z',
      'status': 'new',
      'statusName': 'New',
      'priority': 'normal',
      'priorityName': 'Normal',
      'assignedToName': 'Ravi',
      'messages': [
        {
          'id': '4',
          'body': 'Called customer',
          'createdBy': 'Maya',
          'createdAt': '2026-10-12T09:00:00.000Z',
        },
      ],
      'jobs': [
        {
          'id': '9',
          'employee': 'Ravi',
          'startAt': '2026-10-12T09:30:00.000Z',
          'stopAt': null,
          'durationSeconds': 300,
          'ratePerHour': 100,
          'totalCost': 8.33,
          'status': 'running',
          'createdAt': '2026-10-12T09:30:00.000Z',
        },
      ],
      'activities': [],
    });

    expect(enquiry.number, '1807');
    expect(enquiry.customer, 'Acme Ltd');
    expect(enquiry.assignedTo, 'Ravi');
    expect(enquiry.comments.single.comment, 'Called customer');
    expect(enquiry.jobs.single.isRunning, isTrue);
    expect(enquiry.jobs.single.hours, closeTo(5 / 60, 0.0001));
  });

  test('maps live SOP duties and reporting for mobile', () {
    final duty = CrmDuty.fromJson({
      'department': 'Stores - TMR',
      'frequency': 'Daily',
      'id': 42,
      'itemTitle': 'Opening Checklist',
      'instructions': '<p>Check the counter.</p>',
      'sopTitle': 'Store Opening',
    });

    expect(duty.assignmentId, 42);
    expect(duty.sopName, 'Store Opening · Opening Checklist');
    expect(duty.steps, 'Check the counter.');
  });

  test('formats job duration from actual recorded times', () {
    CrmJobExecution execution({
      required String start,
      String? stop,
      double hours = 0,
    }) => CrmJobExecution(
      name: 'JOBEXE1',
      employee: 'HR-EMP-00001',
      createdAt: DateTime(2026, 8, 30),
      date: '2026-08-30',
      startTime: start,
      stopTime: stop,
      hours: hours,
      employeeCostPerHour: 0,
      totalCost: 0,
      status: stop == null ? 'Running' : 'Completed',
    );

    expect(
      formatJobDuration(execution(start: '09:43:38', stop: '09:43:47')),
      '9 sec',
    );
    expect(
      formatJobDuration(execution(start: '09:43:38', stop: '09:45:12')),
      '1 min',
    );
    expect(
      formatJobDuration(execution(start: '09:43:38', stop: '10:45:12')),
      '1 hr 1 min',
    );
    expect(
      formatJobDuration(
        execution(start: '09:43:38'),
        now: DateTime(2026, 8, 30, 9, 43, 48),
      ),
      '10 sec',
    );
    expect(
      formatJobDuration(execution(start: '', stop: null, hours: 0.5)),
      'Running',
    );
  });

  testWidgets('shows the CRM sign-in screen', (WidgetTester tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: LoginPage(
          api: CrmMobileApi('http://127.0.0.1:7010'),
          onSignedIn: (session, {corporateId, password}) {},
        ),
      ),
    );

    expect(find.text('Welcome'), findsOneWidget);
    expect(find.text('Sign in'), findsOneWidget);
  });

  testWidgets('unlocks automatically after four PIN digits', (
    WidgetTester tester,
  ) async {
    String? submittedPin;
    await tester.pumpWidget(
      MaterialApp(
        home: PinUnlockPage(
          email: 'vijay@example.com',
          biometricEnabled: false,
          onPin: (pin) async {
            submittedPin = pin;
            return true;
          },
          onBiometric: () async => false,
          onUsePassword: () {},
        ),
      ),
    );

    final pinInput = tester.widget<TextField>(find.byType(TextField));
    expect(pinInput.autofocus, isTrue);

    await tester.enterText(find.byType(TextField), '12345');
    await tester.pump();

    expect(submittedPin, '1234');
    expect(find.text('•'), findsNWidgets(4));
  });

  testWidgets('sets a PIN automatically after both four-digit entries', (
    WidgetTester tester,
  ) async {
    String? savedPin;
    await tester.pumpWidget(
      MaterialApp(
        home: PinSetupPage(
          biometricAvailable: false,
          onComplete: (pin, _) async => savedPin = pin,
        ),
      ),
    );

    final inputs = find.byType(TextField);
    expect(inputs, findsNWidgets(2));
    expect(tester.widget<TextField>(inputs.first).autofocus, isTrue);

    await tester.enterText(inputs.first, '2468');
    await tester.pump();
    await tester.enterText(inputs.last, '2468');
    await tester.pump();

    expect(savedPin, '2468');
  });

  testWidgets('shows the dashboard dock destinations', (
    WidgetTester tester,
  ) async {
    final navigation = DashboardNavigation();
    await tester.pumpWidget(
      MaterialApp(
        home: Stack(
          children: [
            DashboardPage(
              api: _FakeCrmMobileApi(),
              session: const UserSession(
                accessToken: 'test-token',
                profile: UserProfile(
                  name: 'Vijay Anand',
                  email: 'vijay@example.com',
                  role: 'admin',
                ),
              ),
              navigation: navigation,
              onSignOut: () {},
              enableLiveNotifications: false,
            ),
            Align(
              alignment: Alignment.bottomCenter,
              child: AppFooterDock(
                selectedIndex: navigation.selectedIndex,
                onDestinationSelected: navigation.selectDockDestination,
              ),
            ),
          ],
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Home'), findsOneWidget);
    expect(find.text('Enquiries'), findsNWidgets(2));
    expect(find.text('Chat'), findsOneWidget);
    expect(find.text('Menu'), findsOneWidget);
    expect(find.text('Duty'), findsOneWidget);
    expect(find.text('Activities'), findsOneWidget);

    await tester.tap(find.text('Menu'));
    await tester.pumpAndSettle();
    expect(find.text('Duty'), findsNWidgets(2));
    expect(find.text('Call logs'), findsOneWidget);
    expect(find.text('Actions'), findsOneWidget);
    Navigator.of(tester.element(find.text('Call logs'))).pop();
    await tester.pumpAndSettle();

    await tester.tap(find.byTooltip('Account options'));
    await tester.pumpAndSettle();
    expect(find.text('Account'), findsOneWidget);
    expect(find.text('vijay@example.com'), findsOneWidget);
    expect(find.text('Sign out'), findsOneWidget);
    Navigator.of(tester.element(find.text('Account'))).pop();
    await tester.pumpAndSettle();

    await tester.tap(find.text('Enquiries').last);
    await tester.pumpAndSettle();
    expect(find.byTooltip('New enquiry'), findsOneWidget);
    expect(find.byType(TextField), findsOneWidget);
    expect(find.text('All'), findsNothing);
    expect(find.text('Assigned'), findsNothing);
    expect(find.text('Created'), findsNothing);
  });

  testWidgets('shows the job detail comments and reply flow', (
    WidgetTester tester,
  ) async {
    final fakeApi = _FakeCrmMobileApi();
    await tester.pumpWidget(
      MaterialApp(
        home: JobDetailPage(
          api: fakeApi,
          session: const UserSession(
            accessToken: 'test-token',
            profile: UserProfile(
              email: 'vijay@example.com',
              name: 'Vijay Anand',
              role: 'user',
            ),
          ),
          initialJob: _testCrmJob,
          capturePosition: () async => Position(
            latitude: 13.0827,
            longitude: 80.2707,
            timestamp: DateTime(2026, 10, 14),
            accuracy: 8.5,
            altitude: 0,
            altitudeAccuracy: 0,
            heading: 0,
            headingAccuracy: 0,
            speed: 0,
            speedAccuracy: 0,
          ),
          enquiry: const DashboardListItem(
            enquiryNumber: '762',
            title: 'ROG Asus Adopter 240W',
            customer: 'Vee Cee Exports',
            list: 'Spares',
            assignedTo: 'Vijay Anand',
            dueDate: '03 Aug',
            createdBy: 'Vijay Anand',
            createdAgo: '3 days ago',
            lastAction: 'Awaiting customer confirmation',
          ),
        ),
      ),
    );

    expect(find.text('#762  Open'), findsOneWidget);
    expect(find.text('Comments'), findsNothing);
    expect(find.text('Jobs'), findsNothing);
    expect(find.text('Activity'), findsNothing);

    await tester.tap(find.byTooltip('Add action'));
    await tester.pumpAndSettle();
    expect(find.text('Scan document'), findsOneWidget);
    expect(find.text('Take photo'), findsOneWidget);
    expect(find.text('Log location'), findsOneWidget);
    expect(find.text('Mark completed'), findsOneWidget);
    expect(find.text('Charges'), findsOneWidget);
    expect(find.text('Collected Rs.'), findsOneWidget);
    await tester.tap(find.text('Log location'));
    await tester.pumpAndSettle();
    expect(fakeApi.postedComments, contains('Location logged from mobile.'));
    expect(fakeApi.loggedLocations, isNotEmpty);
    expect(fakeApi.loggedLocations.first.latitude, 13.0827);
    expect(fakeApi.loggedLocations.first.longitude, 80.2707);

    await tester.tap(find.byTooltip('Add action'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Charges'));
    await tester.pumpAndSettle();
    await tester.enterText(find.byType(TextField).last, '1250');
    await tester.tap(find.text('Save'));
    await tester.pumpAndSettle();
    expect(fakeApi.postedComments, contains('Charges: ₹1250'));

    await tester.tap(find.byTooltip('Add action'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Collected Rs.'));
    await tester.pumpAndSettle();
    await tester.enterText(find.byType(TextField).last, '500');
    await tester.tap(find.text('Save'));
    await tester.pumpAndSettle();
    expect(fakeApi.postedComments, contains('Collected: ₹500'));

    await tester.tap(find.byTooltip('Add action'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Mark completed'));
    await tester.pumpAndSettle();
    expect(
      find.text('Completion sent. Waiting for web approval.'),
      findsOneWidget,
    );
    expect(fakeApi.loggedLocations.length, greaterThanOrEqualTo(2));

    await tester.enterText(
      find.byType(TextField),
      'Customer asked for a quotation update.',
    );
    await tester.tap(find.byTooltip('Send reply'));
    await tester.pumpAndSettle();

    expect(find.text('Customer asked for a quotation update.'), findsOneWidget);
  });

  testWidgets('starts and stops jobs immediately and shows system comments', (
    WidgetTester tester,
  ) async {
    final api = _FakeCrmMobileApi();
    await tester.pumpWidget(
      MaterialApp(
        home: JobDetailPage(
          api: api,
          session: const UserSession(
            accessToken: 'test-token',
            profile: UserProfile(
              email: 'vijay@example.com',
              name: 'Vijay Anand',
              role: 'user',
            ),
          ),
          initialJob: _testCrmJob,
          enquiry: const DashboardListItem(
            enquiryNumber: '762',
            title: 'ROG Asus Adopter 240W',
            customer: 'Vee Cee Exports',
            list: 'Spares',
            assignedTo: 'Vijay Anand',
            dueDate: '03 Aug',
            createdBy: 'Vijay Anand',
            createdAgo: '3 days ago',
            lastAction: 'Awaiting customer confirmation',
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    await tester.tap(find.byTooltip('Add action'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Start job'));
    await tester.pumpAndSettle();

    expect(api.startJobCalls, 1);
    expect(find.text('Job started by Vijay Anand.'), findsOneWidget);

    await tester.tap(find.byTooltip('Add action'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Stop job').first);
    await tester.pumpAndSettle();

    expect(api.stopJobCalls, 1);
    expect(find.text('Job #762 stopped.'), findsOneWidget);
  });

  testWidgets('shows the live Messages loading state', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(
      MaterialApp(
        home: MessagesPage(
          api: CrmMobileApi('http://127.0.0.1:7010'),
          session: const UserSession(
            accessToken: 'test-token',
            profile: UserProfile(
              name: 'Vijay Anand',
              email: 'vijay@example.com',
              role: 'admin',
            ),
          ),
        ),
      ),
    );

    expect(find.text('Messages'), findsOneWidget);
    expect(find.byType(CircularProgressIndicator), findsOneWidget);
  });

  testWidgets('filters enquiries by search query in MyEnquiriesPage', (
    WidgetTester tester,
  ) async {
    final fakeApi = _FakeCrmMobileApi();
    await tester.pumpWidget(
      MaterialApp(
        home: MyEnquiriesPage(
          api: fakeApi,
          session: const UserSession(
            accessToken: 'test-token',
            profile: UserProfile(
              email: 'vijay@example.com',
              name: 'Vijay Anand',
              role: 'user',
            ),
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(fakeApi.requestedEnquiryScope, 'assigned');
    expect(fakeApi.requestedEnquiryFilter, 'active');
    expect(find.text('ROG Asus Adopter 240W'), findsOneWidget);

    final searchField = find.byType(TextField);
    expect(searchField, findsOneWidget);

    await tester.enterText(searchField, 'Dell');
    await tester.pumpAndSettle();
    expect(find.text('ROG Asus Adopter 240W'), findsNothing);
    expect(find.text('No enquiries are in this list.'), findsOneWidget);

    await tester.enterText(searchField, 'ROG');
    await tester.pumpAndSettle();
    expect(find.text('ROG Asus Adopter 240W'), findsOneWidget);
  });

  testWidgets('loads only assigned enquiries for the home dashboard', (
    WidgetTester tester,
  ) async {
    final fakeApi = _FakeCrmMobileApi();
    final session = const UserSession(
      accessToken: 'test-token',
      profile: UserProfile(
        email: 'vijay@example.com',
        name: 'Vijay Anand',
        role: 'user',
      ),
    );
    final feed = DashboardJobsFeed(api: fakeApi, session: session);

    await feed.refresh();

    expect(fakeApi.requestedEnquiryScope, 'assigned');
    expect(fakeApi.requestedEnquiryFilter, 'active');
    expect(feed.jobs.single.sourceId, _testCrmJob.sourceId);
    feed.dispose();
  });

  testWidgets('refreshes dashboard enquiries after the session is renewed', (
    WidgetTester tester,
  ) async {
    final fakeApi = _FakeCrmMobileApi();
    final session = const UserSession(
      accessToken: 'old-token',
      profile: UserProfile(
        email: 'vijay@example.com',
        name: 'Vijay Anand',
        role: 'user',
      ),
    );
    final feed = DashboardJobsFeed(api: fakeApi, session: session);
    await feed.refresh();

    feed.updateSession(
      const UserSession(
        accessToken: 'renewed-token',
        profile: UserProfile(
          email: 'vijay@example.com',
          name: 'Vijay Anand',
          role: 'user',
        ),
      ),
    );
    await tester.runAsync(() async {
      await Future<void>.delayed(Duration.zero);
    });

    expect(fakeApi.lastEnquiriesAccessToken, 'renewed-token');
    expect(feed.error, isNull);
    feed.dispose();
  });

  testWidgets('supports open call and dynamic status update in JobDetailPage', (
    WidgetTester tester,
  ) async {
    final fakeApi = _FakeCrmMobileApi();
    final newJob = CrmJob(
      id: 762,
      sourceId: '762',
      number: '762',
      title: 'ROG Asus Adopter 240W',
      customer: 'Vee Cee Exports',
      list: 'Spares',
      dueDate: '03 Aug',
      createdBy: 'Vijay Anand',
      createdAt: DateTime(2026, 8, 3),
      lastAction: 'Pending review',
      status: 'New',
      priority: 'normal',
      comments: const [],
      jobs: const [],
      activities: const [],
    );
    fakeApi._job = newJob;

    await tester.pumpWidget(
      MaterialApp(
        home: JobDetailPage(
          api: fakeApi,
          session: const UserSession(
            accessToken: 'test-token',
            profile: UserProfile(
              email: 'vijay@example.com',
              name: 'Vijay Anand',
              role: 'user',
            ),
          ),
          initialJob: newJob,
          enquiry: const DashboardListItem(
            enquiryNumber: '762',
            title: 'ROG Asus Adopter 240W',
            customer: 'Vee Cee Exports',
            list: 'Spares',
            assignedTo: 'Vijay Anand',
            dueDate: '03 Aug',
            createdBy: 'Vijay Anand',
            createdAgo: '3 days ago',
            lastAction: 'Pending review',
            statusName: 'New',
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Open call'), findsOneWidget);
    await tester.tap(find.text('Open call'));
    await tester.pumpAndSettle();

    expect(find.text('New call opened successfully.'), findsOneWidget);
    expect(find.text('Open call'), findsNothing);
    expect(find.text('#762  Open'), findsOneWidget);

    await tester.tap(find.text('#762  Open'));
    await tester.pumpAndSettle();

    expect(find.text('Change Status'), findsOneWidget);
    expect(find.text('In Progress'), findsOneWidget);

    await tester.tap(find.text('In Progress'));
    await tester.pumpAndSettle();

    expect(find.text('Status updated to In Progress.'), findsOneWidget);
    expect(find.text('#762  In Progress'), findsOneWidget);
  });
}

final _testCrmJob = CrmJob(
  id: 762,
  sourceId: '762',
  number: '762',
  title: 'ROG Asus Adopter 240W',
  customer: 'Vee Cee Exports',
  list: 'Spares',
  dueDate: '03 Aug',
  createdBy: 'Vijay Anand',
  createdAt: DateTime(2026, 8, 3),
  lastAction: 'Awaiting customer confirmation',
  status: 'open',
  priority: 'normal',
  comments: const [],
  jobs: const [],
  activities: const [],
);

class _FakeCrmMobileApi extends CrmMobileApi {
  _FakeCrmMobileApi() : super('http://127.0.0.1:7010');

  CrmJob _job = _testCrmJob;
  ClosureRequest? _closureRequest;
  final List<String> postedComments = [];
  var startJobCalls = 0;
  var stopJobCalls = 0;
  String? requestedEnquiryScope;
  String? requestedEnquiryFilter;
  String? lastEnquiriesAccessToken;

  @override
  Future<List<CrmJob>> assignedJobs(String accessToken) async => [_job];

  @override
  Future<List<CrmJob>> assignedJobDetails(String accessToken) async => [_job];

  @override
  Future<List<CrmDuty>> duties(String accessToken) async => [];

  @override
  Future<List<CrmJob>> createdEnquiries(String accessToken) async => [_job];

  @override
  Future<int> activitiesCount(String accessToken) async => 0;

  @override
  Future<List<CrmJob>> enquiries({
    required String accessToken,
    String scope = 'all',
    String filter = 'all',
    String search = '',
    String? listInId,
    int page = 1,
    int pageSize = 100,
  }) async {
    requestedEnquiryScope = scope;
    requestedEnquiryFilter = filter;
    lastEnquiriesAccessToken = accessToken;
    return [_job];
  }

  @override
  Future<CrmJob> openNewCall({
    required String accessToken,
    required String id,
  }) async {
    _job = CrmJob(
      id: _job.id,
      sourceId: _job.sourceId,
      number: _job.number,
      title: _job.title,
      customer: _job.customer,
      list: _job.list,
      dueDate: _job.dueDate,
      createdBy: _job.createdBy,
      createdAt: _job.createdAt,
      lastAction: 'New call opened',
      status: 'open',
      priority: _job.priority,
      comments: _job.comments,
      jobs: _job.jobs,
      activities: _job.activities,
    );
    return _job;
  }

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
    if (statusId != null) {
      final statuses = const [
        CrmCallEnquiryStatus(id: 'st-1', name: 'Open', code: 'OPEN'),
        CrmCallEnquiryStatus(
          id: 'st-2',
          name: 'In Progress',
          code: 'IN_PROGRESS',
        ),
        CrmCallEnquiryStatus(id: 'st-3', name: 'Won', code: 'WON'),
      ];
      final match = statuses.where((s) => s.id == statusId).firstOrNull;
      if (match != null) {
        _job = CrmJob(
          id: _job.id,
          sourceId: _job.sourceId,
          number: _job.number,
          title: _job.title,
          customer: _job.customer,
          list: _job.list,
          dueDate: _job.dueDate,
          createdBy: _job.createdBy,
          createdAt: _job.createdAt,
          lastAction: _job.lastAction,
          status: match.name,
          priority: _job.priority,
          statusId: match.id,
          priorityId: _job.priorityId,
          listInId: _job.listInId,
          comments: _job.comments,
          jobs: _job.jobs,
          activities: _job.activities,
        );
      }
    }
    return _job;
  }

  @override
  Future<CrmCallEnquiryFormData> callEnquiryFormData(
    String accessToken,
  ) async => const CrmCallEnquiryFormData(
    groups: [],
    assignees: [],
    statuses: [
      CrmCallEnquiryStatus(id: 'st-1', name: 'Open', code: 'OPEN'),
      CrmCallEnquiryStatus(
        id: 'st-2',
        name: 'In Progress',
        code: 'IN_PROGRESS',
      ),
      CrmCallEnquiryStatus(id: 'st-3', name: 'Won', code: 'WON'),
    ],
    priorities: [
      CrmCallEnquiryPriority(id: 'pr-1', name: 'Normal', code: 'NORMAL'),
    ],
  );

  @override
  Future<CrmJob> job(String accessToken, String id) async => _job;

  @override
  Future<CrmJob> startJob({
    required String accessToken,
    required String id,
  }) async {
    startJobCalls++;
    const comment = 'Job started by Vijay Anand.';
    postedComments.add(comment);
    final execution = CrmJobExecution(
      name: 'JOB-1',
      employee: 'Vijay Anand',
      createdAt: DateTime.now(),
      date: null,
      startTime: DateTime.now().toIso8601String(),
      stopTime: null,
      hours: 0,
      employeeCostPerHour: 0,
      totalCost: 0,
      status: 'Running',
    );
    _job = _copyJob(
      comments: [..._job.comments, _systemComment(comment)],
      jobs: [..._job.jobs, execution],
      lastAction: comment,
    );
    return _job;
  }

  @override
  Future<CrmJob> stopJob({
    required String accessToken,
    required String id,
    required String jobName,
  }) async {
    stopJobCalls++;
    final comment = 'Job #762 stopped.';
    postedComments.add(comment);
    final jobs = _job.jobs
        .map(
          (job) => job.name == jobName
              ? CrmJobExecution(
                  name: job.name,
                  employee: job.employee,
                  createdAt: job.createdAt,
                  date: job.date,
                  startTime: job.startTime,
                  stopTime: DateTime.now().toIso8601String(),
                  hours: job.hours,
                  employeeCostPerHour: job.employeeCostPerHour,
                  totalCost: job.totalCost,
                  status: 'Completed',
                )
              : job,
        )
        .toList();
    _job = _copyJob(
      comments: [..._job.comments, _systemComment(comment)],
      jobs: jobs,
      lastAction: comment,
    );
    return _job;
  }

  CrmComment _systemComment(String text) => CrmComment(
    id: 'comment-${postedComments.length}',
    comment: text,
    createdAt: DateTime.now(),
    createdByUserId: 'vijay@example.com',
  );

  CrmJob _copyJob({
    required List<CrmComment> comments,
    required List<CrmJobExecution> jobs,
    required String lastAction,
  }) => CrmJob(
    id: _job.id,
    sourceId: _job.sourceId,
    number: _job.number,
    title: _job.title,
    customer: _job.customer,
    mobile: _job.mobile,
    assignedTo: _job.assignedTo,
    list: _job.list,
    dueDate: _job.dueDate,
    createdBy: _job.createdBy,
    createdAt: _job.createdAt,
    lastAction: lastAction,
    status: _job.status,
    priority: _job.priority,
    statusId: _job.statusId,
    priorityId: _job.priorityId,
    listInId: _job.listInId,
    comments: comments,
    jobs: jobs,
    activities: _job.activities,
  );

  var loggedLocations = <CrmEnquiryLocation>[];

  @override
  Future<List<CrmEnquiryLocation>> enquiryLocations({
    required String accessToken,
    required String enquiryId,
  }) async => loggedLocations;

  @override
  Future<CrmEnquiryLocation> logEnquiryLocation({
    required String accessToken,
    required String enquiryId,
    required double latitude,
    required double longitude,
    required double? accuracyMeters,
    required DateTime capturedAt,
  }) async {
    final item = CrmEnquiryLocation(
      id: 9 + loggedLocations.length,
      latitude: latitude,
      longitude: longitude,
      capturedAt: capturedAt,
      createdBy: 'vijay@example.com',
      accuracyMeters: accuracyMeters,
    );
    loggedLocations.add(item);
    return item;
  }

  @override
  Future<ClosureRequest?> latestClosureRequest({
    required String accessToken,
    required String id,
  }) async => _closureRequest;

  @override
  Future<ClosureRequest> requestClosure({
    required String accessToken,
    required String id,
    String note = '',
  }) async {
    _closureRequest = ClosureRequest(
      id: 91,
      status: 'pending',
      requestedAt: DateTime.now().toIso8601String(),
    );
    return _closureRequest!;
  }

  @override
  Future<CrmJob> addJobComment({
    required String accessToken,
    required String id,
    required String comment,
  }) async {
    postedComments.add(comment);
    _job = CrmJob(
      id: _job.id,
      sourceId: _job.sourceId,
      number: _job.number,
      title: _job.title,
      customer: _job.customer,
      list: _job.list,
      dueDate: _job.dueDate,
      createdBy: _job.createdBy,
      createdAt: _job.createdAt,
      lastAction: comment,
      status: _job.status,
      priority: _job.priority,
      comments: [
        ..._job.comments,
        CrmComment(
          id: 'new-comment',
          comment: comment,
          createdAt: DateTime.now(),
          createdByUserId: 'vijay@example.com',
        ),
      ],
      jobs: _job.jobs,
      activities: _job.activities,
    );
    return _job;
  }
}
