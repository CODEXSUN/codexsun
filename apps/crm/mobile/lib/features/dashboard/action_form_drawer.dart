import 'package:flutter/material.dart';

class ActionFormDrawer extends StatelessWidget {
  const ActionFormDrawer({
    required this.action,
    required this.actions,
    required this.onActionChanged,
    required this.form,
    required this.onConfirm,
    required this.busy,
    this.error,
    this.heading = 'Add action',
    super.key,
  });
  final String action;
  final List<DropdownMenuItem<String>> actions;
  final ValueChanged<String?> onActionChanged;
  final Widget form;
  final VoidCallback onConfirm;
  final bool busy;
  final String? error;
  final String heading;
  @override
  Widget build(BuildContext context) => SafeArea(
    child: Padding(
      padding: EdgeInsets.fromLTRB(
        20,
        4,
        20,
        MediaQuery.viewInsetsOf(context).bottom + 16,
      ),
      child: ConstrainedBox(
        constraints: BoxConstraints(
          maxHeight: MediaQuery.sizeOf(context).height * 0.8,
        ),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(heading, style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                key: ValueKey(action),
                initialValue: action,
                isExpanded: true,
                decoration: const InputDecoration(
                  labelText: 'Action',
                  border: OutlineInputBorder(),
                ),
                items: actions,
                onChanged: busy ? null : onActionChanged,
              ),
              const SizedBox(height: 16),
              form,
              if (error != null) ...[
                const SizedBox(height: 12),
                Text(
                  error!,
                  style: TextStyle(color: Theme.of(context).colorScheme.error),
                ),
              ],
              const SizedBox(height: 20),
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  TextButton(
                    onPressed: busy
                        ? null
                        : () => Navigator.pop(context, false),
                    child: const Text('Cancel'),
                  ),
                  const SizedBox(width: 8),
                  FilledButton(
                    onPressed: busy ? null : onConfirm,
                    child: const Text('Confirm'),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    ),
  );
}
