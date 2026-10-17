import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:codexsun_crm_mobile/core/api/crm_mobile_api.dart';
import 'package:codexsun_crm_mobile/core/messaging/live_message_notifications.dart';
import 'package:codexsun_crm_mobile/features/dashboard/dashboard_stats.dart';
import 'package:codexsun_crm_mobile/features/dashboard/messages_sample_page.dart';

const session = UserSession(
  accessToken: 'test',
  profile: UserProfile(
    email: 'reader@example.test',
    name: 'Reader',
    role: 'admin',
  ),
);

class HomeApi extends CrmMobileApi {
  HomeApi() : super('http://localhost');
  int taskCount = 2;
  int activityCount = 4;
  int unread = 0;
  int latest = 1;
  final reads = <int?>[];
  @override
  Future<int> tasksCount(String token) async => taskCount;
  @override
  Future<int> activitiesCount(String token) async => activityCount;
  @override
  Future<List<CrmDuty>> duties(String token) async => [];
  @override
  Future<List<Map<String, dynamic>>> tasks(
    String token, {
    String filter = 'active',
  }) async => [];
  @override
  Future<List<MessagingConversation>> conversations({
    required String accessToken,
    required String currentEmail,
  }) async => [conversation];
  MessagingConversation get conversation => MessagingConversation(
    id: 1,
    uuid: 'testchan',
    title: 'Task: Home test',
    preview: 'Assigned task',
    updatedAt: DateTime.utc(2026),
    unreadCount: unread,
  );
  @override
  Future<List<MessagingMessage>> messages(
    String token,
    dynamic conversationId,
  ) async => [
    MessagingMessage(
      id: latest,
      uuid: 'msg$latest',
      channelUuid: 'testchan',
      senderName: 'Sender',
      senderEmail: 'sender@example.test',
      content: 'Visible message $latest',
      createdAt: DateTime.utc(2026),
      status: 'active',
    ),
  ];
  @override
  Future<void> markConversationRead({
    required String accessToken,
    required dynamic conversationId,
    int? messageId,
  }) async {
    reads.add(messageId);
    unread = 0;
  }
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  const channel = MethodChannel('in.codexsun.crm_app/mobile-actions');
  setUp(() {
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(
          channel,
          (call) async => call.method == 'hasCallLogAccess' ? true : [],
        );
  });
  tearDown(() {
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(channel, null);
  });
  testWidgets('all Home cards navigate and counts refresh after changes', (
    tester,
  ) async {
    final api = HomeApi();
    final destinations = <int>[];
    var actions = 0;
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: DashboardStats(
            api: api,
            session: session,
            jobCount: 3,
            onOpenList: destinations.add,
            onOpenActions: () async {
              actions++;
            },
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();
    await tester.tap(find.text('Enquiries'));
    await tester.tap(find.text('Duty'));
    await tester.tap(find.text('Chat'));
    await tester.tap(find.text('Activities'));
    expect(destinations, [1, 2, 3]);
    expect(actions, 1);
    expect(find.text('2'), findsOneWidget);
    api.taskCount = 7;
    api.activityCount = 9;
    await tester.pump(const Duration(seconds: 20));
    await tester.pumpAndSettle();
    expect(find.text('7'), findsOneWidget);
    expect(find.text('9'), findsOneWidget);
    await tester.tap(find.text('Tasks'));
    await tester.pumpAndSettle();
    expect(find.text('No active tasks.'), findsOneWidget);
    await tester.pageBack();
    await tester.pumpAndSettle();
    await tester.tap(find.text('Call logs'));
    await tester.pumpAndSettle();
    expect(find.text('Call Logs'), findsOneWidget);
    await tester.pumpWidget(const SizedBox());
  });
  test('assignment and message unread snapshots clear after reading', () async {
    final api = HomeApi();
    final notifications = LiveMessageNotifications(api: api, session: session);
    await notifications.refresh();
    expect(notifications.unreadCount, 0);
    api.unread = 1;
    await notifications.refresh();
    expect(notifications.unreadFor('Task:'), 1);
    api.unread = 2;
    await notifications.refresh();
    expect(notifications.unreadCount, 2);
    await api.markConversationRead(
      accessToken: 'test',
      conversationId: 'testchan',
      messageId: 2,
    );
    await notifications.refresh();
    expect(notifications.unreadCount, 0);
    expect(notifications.unreadConversations, isEmpty);
    notifications.dispose();
  });
  testWidgets('visible messages are marked read on entry and during polling', (
    tester,
  ) async {
    final api = HomeApi();
    var refreshed = 0;
    await tester.pumpWidget(
      MaterialApp(
        home: Builder(
          builder: (context) => Scaffold(
            body: TextButton(
              onPressed: () => openMessagingConversation(
                context: context,
                api: api,
                session: session,
                conversation: api.conversation,
                onRead: () => refreshed++,
              ),
              child: const Text('Open'),
            ),
          ),
        ),
      ),
    );
    await tester.tap(find.text('Open'));
    await tester.pumpAndSettle();
    expect(api.reads, [1]);
    api.latest = 2;
    api.unread = 1;
    await tester.pump(const Duration(seconds: 3));
    await tester.pumpAndSettle();
    expect(api.reads.last, 2);
    expect(api.unread, 0);
    expect(refreshed, greaterThanOrEqualTo(2));
    await tester.pump(const Duration(milliseconds: 100));
    await tester.pumpAndSettle();
    expect(find.text('Visible message 2'), findsOneWidget);
    await tester.pumpWidget(const SizedBox());
  });
}
