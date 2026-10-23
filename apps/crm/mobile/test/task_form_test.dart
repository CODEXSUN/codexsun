import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:codexsun_crm_mobile/core/api/crm_mobile_api.dart';
import 'package:codexsun_crm_mobile/features/dashboard/task_form_page.dart';

class TaskFormApi extends CrmMobileApi {
  TaskFormApi() : super('http://localhost');
  Map<String, dynamic>? saved;

  @override
  Future<Map<String, dynamic>> taskOptions(String accessToken) async => {
    'capabilities': {'create': true},
    'lists': [
      {'id': 1, 'name': 'Office'},
    ],
    'users': [],
    'priorities': [
      {'id': 2, 'code': 'normal'},
    ],
    'statuses': [
      {'id': 3, 'code': 'new'},
    ],
  };

  @override
  Future<Map<String, dynamic>> createTask(
    String token,
    Map<String, dynamic> payload,
  ) async {
    saved = payload;
    return {'id': 1};
  }
}

void main() {
  testWidgets('task message saves with hidden defaults and optional contact', (
    tester,
  ) async {
    final api = TaskFormApi();
    await tester.pumpWidget(
      MaterialApp(
        home: TaskFormPage(
          api: api,
          session: const UserSession(
            accessToken: 'test',
            profile: UserProfile(
              email: 'test@example.test',
              name: 'Test',
              role: 'user',
            ),
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.text('Task title *'), findsNothing);
    expect(find.text('Priority *'), findsNothing);
    expect(find.text('Status *'), findsNothing);
    expect(find.text('Due date'), findsNothing);
    await tester.ensureVisible(find.byKey(const ValueKey('task-message')));
    await tester.enterText(
      find.byKey(const ValueKey('task-message')),
      'Check the customer request',
    );
    await tester.tap(find.text('Save'));
    await tester.pumpAndSettle();
    expect(api.saved?['description'], 'Check the customer request');
    expect(api.saved?['title'], 'Check the customer request');
    expect(api.saved?['priorityId'], 2);
    expect(api.saved?['statusId'], 3);
    expect(api.saved?['dueDate'], isNull);
    expect(api.saved?['contactId'], isNull);
  });
}
