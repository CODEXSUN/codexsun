import 'package:flutter/material.dart';

import 'services/portal_api.dart';
import 'screens/login_screen.dart';
import 'screens/workspace_screen.dart';

void main() => runApp(const CodexsunMobileApp());

class CodexsunMobileApp extends StatefulWidget {
  const CodexsunMobileApp({super.key});
  @override
  State<CodexsunMobileApp> createState() => _CodexsunMobileAppState();
}

class _CodexsunMobileAppState extends State<CodexsunMobileApp> {
  final api = PortalApi(
    const String.fromEnvironment(
      'CODEXSUN_API_URL',
      defaultValue: 'http://127.0.0.1:7010',
    ),
  );
  bool signedIn = false;
  @override
  void initState() {
    super.initState();
    api.onSessionExpired = () {
      if (mounted && signedIn) setState(() => signedIn = false);
    };
  }

  @override
  Widget build(BuildContext context) => MaterialApp(
    title: 'CODEXSUN',
    debugShowCheckedModeBanner: false,
    theme: ThemeData(
      colorSchemeSeed: const Color(0xff29566b),
      useMaterial3: true,
      inputDecorationTheme: const InputDecorationTheme(
        border: OutlineInputBorder(),
      ),
    ),
    home: signedIn
        ? WorkspaceScreen(
            api: api,
            onLogout: () => setState(() => signedIn = false),
          )
        : LoginScreen(api: api, onLogin: () => setState(() => signedIn = true)),
  );
  @override
  void dispose() {
    api.dispose();
    super.dispose();
  }
}
