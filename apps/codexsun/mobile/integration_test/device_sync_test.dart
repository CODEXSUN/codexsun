import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:codexsun_mobile/main.dart';

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();
  testWidgets('real web and Android device communication', (tester) async {
    const run = String.fromEnvironment('CODEXSUN_TEST_RUN');
    expect(
      run,
      isNotEmpty,
      reason: 'Supply isolated test credentials and run ID.',
    );
    await tester.pumpWidget(const CodexsunMobileApp());
    await tester.enterText(
      find.byKey(const Key('corporate-id')),
      const String.fromEnvironment('CODEXSUN_TEST_CORPORATE_ID'),
    );
    await tester.enterText(
      find.byKey(const Key('email')),
      const String.fromEnvironment('CODEXSUN_TEST_EMAIL'),
    );
    await tester.enterText(
      find.byKey(const Key('password')),
      const String.fromEnvironment('CODEXSUN_TEST_PASSWORD'),
    );
    await tester.tap(find.byKey(const Key('sign-in')));
    await waitFor(tester, find.text('Live connected'));
    await tester.enterText(
      find.byKey(const Key('device-message')),
      'Mobile emulator hello $run',
    );
    await tester.tap(find.byKey(const Key('send-message')));
    await waitFor(tester, find.text('web: Web portal hello $run'));
    await tester.tap(find.byKey(const Key('ping-server')));
    await waitFor(tester, find.text('Server acknowledged'));
    await tester.tap(find.byKey(const Key('new-requirement')));
    await tester.pumpAndSettle();
    await tester.enterText(
      find.byKey(const Key('requirement-title')),
      'Mobile live idea $run',
    );
    await tester.enterText(
      find.byKey(const Key('requirement-description')),
      'Created on the Android emulator and delivered to the web portal automatically.',
    );
    await tester.tap(find.byKey(const Key('save-requirement')));
    await waitFor(tester, find.text('Web live idea $run'));
    expect(find.text('Mobile live idea $run'), findsOneWidget);
    final card = find.ancestor(
      of: find.text('Web live idea $run'),
      matching: find.byType(Card),
    );
    final approve = find.descendant(of: card, matching: find.text('Approve'));
    await waitFor(tester, approve);
    await tester.ensureVisible(approve);
    await tester.tap(approve);
    await waitFor(
      tester,
      find.descendant(of: card, matching: find.text('approved · revision 3')),
    );
  });
}

Future<void> waitFor(WidgetTester tester, Finder finder) async {
  final end = DateTime.now().add(const Duration(seconds: 90));
  while (DateTime.now().isBefore(end)) {
    await tester.pump(const Duration(milliseconds: 200));
    if (finder.evaluate().isNotEmpty) return;
    await Future<void>.delayed(const Duration(milliseconds: 200));
  }
  expect(finder, findsWidgets);
}
