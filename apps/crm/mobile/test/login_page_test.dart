import 'package:codexsun_crm_mobile/core/api/crm_mobile_api.dart';
import 'package:codexsun_crm_mobile/core/presentation/app_brand_logo.dart';
import 'package:codexsun_crm_mobile/features/auth/login_page.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('uses a compact brand logo on sign in', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: LoginPage(
          api: CrmMobileApi('https://codexsun.com/api/platform'),
          onSignedIn: (session, {password, corporateId}) {},
        ),
      ),
    );

    final logo = tester.widget<AppBrandLogo>(find.byType(AppBrandLogo));
    expect(logo.width, 48);
    expect(logo.height, 48);
    expect(find.textContaining('Sign in to your'), findsNothing);
  });
}
