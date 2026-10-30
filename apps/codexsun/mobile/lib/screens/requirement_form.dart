import 'package:flutter/material.dart';

import '../services/portal_api.dart';
import '../services/portal_socket.dart';

class RequirementForm extends StatefulWidget {
  const RequirementForm({super.key, required this.api});
  final PortalApi api;
  @override
  State<RequirementForm> createState() => _RequirementFormState();
}

class _RequirementFormState extends State<RequirementForm> {
  final title = TextEditingController(), description = TextEditingController();
  final clientKey = requestKey();
  String error = '';
  bool busy = false;
  Future<void> save() async {
    if (title.text.trim().isEmpty || description.text.trim().isEmpty) {
      setState(() => error = 'Enter a title and requirement.');
      return;
    }
    setState(() {
      busy = true;
      error = '';
    });
    try {
      await widget.api.post('/codexsun/requirements', {
        'clientKey': clientKey,
        'title': title.text.trim(),
        'description': description.text.trim(),
        'priority': 'normal',
        'origin': 'mobile',
      });
      if (mounted) Navigator.pop(context);
    } catch (cause) {
      if (mounted) {
        setState(() {
          error = cause.toString();
          busy = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('New idea')),
    body: ListView(
      padding: const EdgeInsets.all(16),
      children: [
        TextField(
          key: const Key('requirement-title'),
          controller: title,
          maxLength: 200,
          decoration: const InputDecoration(labelText: 'Title'),
        ),
        const SizedBox(height: 12),
        TextField(
          key: const Key('requirement-description'),
          controller: description,
          maxLength: 20000,
          maxLines: 6,
          decoration: const InputDecoration(labelText: 'Requirement'),
        ),
        if (error.isNotEmpty)
          Text(
            error,
            style: TextStyle(color: Theme.of(context).colorScheme.error),
          ),
        FilledButton(
          key: const Key('save-requirement'),
          onPressed: busy ? null : save,
          child: Text(busy ? 'Saving…' : 'Save'),
        ),
      ],
    ),
  );
  @override
  void dispose() {
    title.dispose();
    description.dispose();
    super.dispose();
  }
}
