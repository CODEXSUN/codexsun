import 'package:flutter/material.dart';

import '../../core/api/crm_mobile_api.dart';
import 'inline_select_field.dart';

class TaskFormPage extends StatefulWidget {
  const TaskFormPage({required this.api, required this.session, super.key});

  final CrmMobileApi api;
  final UserSession session;

  @override
  State<TaskFormPage> createState() => _TaskFormPageState();
}

class _TaskFormPageState extends State<TaskFormPage> {
  final _formKey = GlobalKey<FormState>();
  final _description = TextEditingController();
  final _contactName = TextEditingController();
  final _contactPhone = TextEditingController();
  late Future<Map<String, dynamic>> _options;
  int? _listId;
  int? _priorityId;
  int? _statusId;
  int? _assigneeId;
  int? _contactId;
  String? _matchedContact;
  bool _saving = false;
  bool _defaultsApplied = false;

  @override
  void initState() {
    super.initState();
    _options = widget.api.taskOptions(widget.session.accessToken);
  }

  @override
  void dispose() {
    _description.dispose();
    _contactName.dispose();
    _contactPhone.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(
      title: const Text('New task'),
      actions: [
        Padding(
          padding: const EdgeInsets.only(right: 8),
          child: FilledButton(
            onPressed: _saving ? null : _save,
            child: _saving
                ? const SizedBox.square(
                    dimension: 18,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Text('Save'),
          ),
        ),
      ],
    ),
    body: FutureBuilder<Map<String, dynamic>>(
      future: _options,
      builder: (context, snapshot) {
        if (snapshot.hasError) {
          return Center(
            child: FilledButton.tonal(
              onPressed: () => setState(
                () => _options = widget.api.taskOptions(
                  widget.session.accessToken,
                ),
              ),
              child: const Text('Could not load task options. Retry'),
            ),
          );
        }
        if (!snapshot.hasData) {
          return const Center(child: CircularProgressIndicator());
        }
        final data = snapshot.data!;
        final capabilities =
            data['capabilities'] as Map<String, dynamic>? ?? {};
        if (capabilities['create'] != true) {
          return const Center(
            child: Text('You do not have permission to create tasks.'),
          );
        }
        final lists = _rows(data, 'lists');
        final priorities = _rows(data, 'priorities');
        final statuses = _rows(data, 'statuses');
        final users = _rows(data, 'users');
        if (!_defaultsApplied) {
          _listId = lists.isEmpty ? null : _id(lists.first);
          _priorityId = _preferredId(priorities, 'normal');
          _statusId = _preferredId(statuses, 'new');
          _defaultsApplied = true;
        }
        return Form(
          key: _formKey,
          child: ListView(
            padding: const EdgeInsets.fromLTRB(20, 18, 20, 24),
            children: [
              TextField(
                key: const ValueKey('task-mobile'),
                controller: _contactPhone,
                autofocus: true,
                keyboardType: TextInputType.phone,
                maxLength: 10,
                onChanged: (_) => setState(() {
                  _contactId = null;
                  _matchedContact = null;
                }),
                decoration: const InputDecoration(
                  labelText: 'Mobile number',
                  counterText: '',
                  helperText: 'Use the 10-digit customer mobile number.',
                ),
              ),
              if (_matchedContact != null) ...[
                const SizedBox(height: 6),
                Text(
                  _matchedContact!,
                  style: const TextStyle(color: Color(0xFF23824E)),
                ),
              ],
              const SizedBox(height: 14),
              TextField(
                controller: _contactName,
                textCapitalization: TextCapitalization.words,
                onChanged: (_) => setState(() {
                  _contactId = null;
                  _matchedContact = null;
                }),
                decoration: InputDecoration(
                  labelText: 'Customer name (optional)',
                  suffixIcon: IconButton(
                    tooltip: 'Find contact for this phone number',
                    onPressed: _lookupContact,
                    icon: const Icon(Icons.person_search_outlined),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              InlineSelectField(
                label: 'List',
                value: _listId?.toString(),
                options: [
                  const InlineSelectOption(label: 'No list', value: null),
                  ...lists.map(
                    (row) => InlineSelectOption(
                      value: _id(row).toString(),
                      label: '${row['name'] ?? ''}',
                    ),
                  ),
                ],
                onChanged: (value) =>
                    setState(() => _listId = int.tryParse(value ?? '')),
              ),
              const SizedBox(height: 16),
              InlineSelectField(
                label: 'Allocated',
                value: _assigneeId?.toString(),
                options: [
                  const InlineSelectOption(label: 'Not allocated', value: null),
                  ...users.map(
                    (row) => InlineSelectOption(
                      value: _id(row).toString(),
                      label: '${row['name'] ?? row['email'] ?? ''}',
                    ),
                  ),
                ],
                onChanged: (value) =>
                    setState(() => _assigneeId = int.tryParse(value ?? '')),
              ),
              const SizedBox(height: 16),
              TextFormField(
                key: const ValueKey('task-message'),
                controller: _description,
                minLines: 5,
                maxLines: 8,
                textCapitalization: TextCapitalization.sentences,
                decoration: const InputDecoration(
                  labelText: 'Task message',
                  alignLabelWithHint: true,
                  border: OutlineInputBorder(),
                ),
                validator: (value) => value == null || value.trim().isEmpty
                    ? 'Enter a task message.'
                    : null,
              ),
            ],
          ),
        );
      },
    ),
  );

  Future<void> _lookupContact() async {
    final phone = _contactPhone.text.replaceAll(RegExp(r'\D'), '');
    if (phone.length != 10) {
      _message('Enter the 10-digit mobile number to search.');
      return;
    }
    final lookup = widget.api.partiesByMobile(
      accessToken: widget.session.accessToken,
      mobile: phone,
    );
    await showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      builder: (context) => SafeArea(
        child: FutureBuilder<List<CrmPartyReference>>(
          future: lookup,
          builder: (context, snapshot) {
            if (snapshot.connectionState != ConnectionState.done) {
              return const SizedBox(
                height: 140,
                child: Center(child: CircularProgressIndicator()),
              );
            }
            if (snapshot.hasError) {
              return SizedBox(
                height: 140,
                child: Center(
                  child: Text('Could not find contact for $phone.'),
                ),
              );
            }
            final parties = snapshot.data ?? const <CrmPartyReference>[];
            if (parties.isEmpty) {
              return SizedBox(
                height: 140,
                child: Center(child: Text('No contact found for $phone.')),
              );
            }
            return ListView(
              shrinkWrap: true,
              children: parties
                  .map(
                    (party) => ListTile(
                      leading: Icon(
                        party.type.toLowerCase() == 'supplier'
                            ? Icons.local_shipping_outlined
                            : Icons.person_outline,
                      ),
                      title: Text(party.name),
                      subtitle: Text('${party.type} · $phone'),
                      trailing: const Icon(Icons.chevron_right),
                      onTap: () {
                        setState(() {
                          _contactId = int.tryParse(party.id);
                          _matchedContact = party.name;
                          _contactName.text = party.name;
                        });
                        Navigator.pop(context);
                      },
                    ),
                  )
                  .toList(),
            );
          },
        ),
      ),
    );
  }

  Future<void> _save() async {
    if (_saving || _formKey.currentState == null) return;
    if (!_formKey.currentState!.validate() ||
        _priorityId == null ||
        _statusId == null)
      return;
    final phone = _contactPhone.text.replaceAll(RegExp(r'\D'), '');
    if (phone.isNotEmpty && phone.length != 10) {
      _message('Enter a 10-digit mobile number.');
      return;
    }
    setState(() => _saving = true);
    try {
      await widget.api.createTask(widget.session.accessToken, {
        'contactId': _contactId,
        'capturedName': _contactName.text.trim().isEmpty
            ? null
            : _contactName.text.trim(),
        'capturedPhone': phone.isEmpty ? null : phone,
        'title': _titleFromMessage(_description.text.trim()),
        'description': _description.text.trim(),
        'listInId': _listId,
        'priorityId': _priorityId,
        'statusId': _statusId,
        'assignedUserId': _assigneeId,
        'dueDate': null,
      });
      if (mounted) Navigator.pop(context, true);
    } on CrmMobileApiException catch (error) {
      _message(error.message);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  void _message(String text) => ScaffoldMessenger.of(context)
    ..hideCurrentSnackBar()
    ..showSnackBar(SnackBar(content: Text(text)));

  static List<Map<String, dynamic>> _rows(
    Map<String, dynamic> data,
    String key,
  ) => (data[key] as List? ?? const [])
      .whereType<Map<String, dynamic>>()
      .toList();

  static int _id(Map<String, dynamic> row) => (row['id'] as num).toInt();

  static int? _preferredId(List<Map<String, dynamic>> rows, String code) {
    if (rows.isEmpty) return null;
    final preferred = rows
        .where((row) => '${row['code']}'.toLowerCase() == code)
        .firstOrNull;
    return _id(preferred ?? rows.first);
  }

  static String _titleFromMessage(String message) {
    final normalized = message.replaceAll(RegExp(r'\s+'), ' ').trim();
    if (normalized.length <= 44) return normalized;
    return '${normalized.substring(0, 43).trimRight()}…';
  }
}
