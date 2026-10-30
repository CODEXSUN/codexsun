import 'package:flutter/material.dart';

import '../services/portal_api.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key, required this.api, required this.onLogin});
  final PortalApi api;
  final VoidCallback onLogin;
  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final corporate = TextEditingController(),
      email = TextEditingController(),
      password = TextEditingController();
  bool busy = false;
  String error = '';
  Future<void> signIn() async {
    setState(() {
      busy = true;
      error = '';
    });
    try {
      await widget.api.login(
        corporate.text.trim(),
        email.text.trim(),
        password.text,
      );
      password.clear();
      if (mounted) widget.onLogin();
    } catch (cause) {
      if (mounted) setState(() => error = cause.toString());
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('CODEXSUN · Zuno')),
    body: Center(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 480),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text(
                'Connect your workspace',
                style: TextStyle(fontSize: 24),
              ),
              const SizedBox(height: 20),
              TextField(
                key: const Key('corporate-id'),
                controller: corporate,
                decoration: const InputDecoration(labelText: 'Corporate ID'),
              ),
              const SizedBox(height: 12),
              TextField(
                key: const Key('email'),
                controller: email,
                keyboardType: TextInputType.emailAddress,
                decoration: const InputDecoration(labelText: 'Email'),
              ),
              const SizedBox(height: 12),
              TextField(
                key: const Key('password'),
                controller: password,
                obscureText: true,
                decoration: const InputDecoration(labelText: 'Password'),
              ),
              if (error.isNotEmpty)
                Text(
                  error,
                  style: TextStyle(color: Theme.of(context).colorScheme.error),
                ),
              const SizedBox(height: 20),
              FilledButton(
                key: const Key('sign-in'),
                onPressed: busy ? null : signIn,
                child: Text(busy ? 'Connecting…' : 'Sign in'),
              ),
            ],
          ),
        ),
      ),
    ),
  );
  @override
  void dispose() {
    corporate.dispose();
    email.dispose();
    password.dispose();
    super.dispose();
  }
}
