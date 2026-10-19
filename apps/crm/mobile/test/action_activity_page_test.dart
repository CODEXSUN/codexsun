import 'package:codexsun_crm_mobile/core/api/crm_mobile_api.dart';
import 'package:codexsun_crm_mobile/features/dashboard/action_activity_page.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

class ActivityWindowApi extends CrmMobileApi {
  ActivityWindowApi() : super('http://localhost');

  final requestedStarts = <DateTime?>[];

  @override
  Future<CrmPage<CrmActivityRecord>> activitiesPage({
    required String accessToken,
    int page = 1,
    int pageSize = 100,
    DateTime? createdAfter,
  }) async {
    requestedStarts.add(createdAfter);
    return CrmPage(items: const [], page: page, pageSize: pageSize, total: 0);
  }
}

void main() {
  testWidgets('activities default to seven days and can extend to thirty', (
    tester,
  ) async {
    final api = ActivityWindowApi();
    const session = UserSession(
      accessToken: 'test-token',
      profile: UserProfile(
        email: 'reader@example.test',
        name: 'Reader',
        role: 'user',
      ),
    );

    await tester.pumpWidget(
      MaterialApp(
        home: ActionActivityPage(api: api, session: session),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Activity from the last 7 days.'), findsOneWidget);
    expect(
      find.text('0 actions performed in the last 7 days.'),
      findsOneWidget,
    );
    expect(api.requestedStarts, hasLength(1));
    expect(DateTime.now().difference(api.requestedStarts.single!).inDays, 7);

    await tester.tap(find.byKey(const ValueKey('activity-window-menu')));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Last 30 days'));
    await tester.pumpAndSettle();

    expect(find.text('Activity from the last 30 days.'), findsOneWidget);
    expect(
      find.text('0 actions performed in the last 30 days.'),
      findsOneWidget,
    );
    expect(api.requestedStarts, hasLength(2));
    expect(DateTime.now().difference(api.requestedStarts.last!).inDays, 30);
  });
}
