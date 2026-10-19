import 'package:flutter/material.dart';

import '../../core/api/crm_mobile_api.dart';

class TaskFormPage extends StatefulWidget {
  const TaskFormPage({required this.api, required this.session, super.key});

  final CrmMobileApi api;
  final UserSession session;

  @override
  State<TaskFormPage> createState() => _TaskFormPageState();
}

class _TaskFormPageState extends State<TaskFormPage> {
  final _formKey = GlobalKey<FormState>();
  final _title = TextEditingController();
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
  DateTime? _dueDate;
  bool _saving = false;
  bool _defaultsApplied = false;

  @override
  void initState() {
    super.initState();
    _options = widget.api.taskOptions(widget.session.accessToken);
  }

  @override
  void dispose() {
    _title.dispose();
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
        TextButton(
          onPressed: _saving ? null : _save,
          child: _saving
              ? const SizedBox.square(
                  dimension: 18,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : const Text('Save'),
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
            padding: const EdgeInsets.fromLTRB(18, 16, 18, 32),
            children: [
              TextFormField(
                controller: _title,
                autofocus: true,
                textCapitalization: TextCapitalization.sentences,
                decoration: const InputDecoration(labelText: 'Task title *'),
                validator: (value) => value == null || value.trim().isEmpty
                    ? 'Enter a task title.'
                    : null,
              ),
              const SizedBox(height: 14),
              TextFormField(
                controller: _description,
                minLines: 3,
                maxLines: 6,
                textCapitalization: TextCapitalization.sentences,
                decoration: const InputDecoration(
                  labelText: 'Task details',
                  alignLabelWithHint: true,
                ),
              ),
              const SizedBox(height: 18),
              Text(
                'Contact (optional)',
                style: Theme.of(context).textTheme.titleSmall,
              ),
              const SizedBox(height: 10),
              TextField(
                controller: _contactPhone,
                keyboardType: TextInputType.phone,
                maxLength: 10,
                onChanged: (_) => setState(() {
                  _contactId = null;
                  _matchedContact = null;
                }),
                decoration: const InputDecoration(
                  labelText: 'Mobile number',
                  counterText: '',
                ),
              ),
              Align(
                alignment: Alignment.centerRight,
                child: TextButton.icon(
                  onPressed: _lookupContact,
                  icon: const Icon(Icons.person_search_outlined, size: 18),
                  label: Text(
                    _matchedContact == null
                        ? 'Find contact'
                        : '$_matchedContact matched',
                  ),
                ),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: _contactName,
                textCapitalization: TextCapitalization.words,
                decoration: const InputDecoration(labelText: 'Contact name'),
              ),
              const SizedBox(height: 18),
              DropdownButtonFormField<int?>(
                initialValue: _listId,
                decoration: const InputDecoration(labelText: 'List in'),
                items: [
                  const DropdownMenuItem<int?>(
                    value: null,
                    child: Text('No list'),
                  ),
                  ...lists.map(
                    (row) => DropdownMenuItem<int?>(
                      value: _id(row),
                      child: Text('${row['name'] ?? ''}'),
                    ),
                  ),
                ],
                onChanged: (value) => setState(() => _listId = value),
              ),
              const SizedBox(height: 14),
              DropdownButtonFormField<int?>(
                initialValue: _assigneeId,
                decoration: const InputDecoration(labelText: 'Assigned to'),
                items: [
                  const DropdownMenuItem<int?>(
                    value: null,
                    child: Text('Unassigned'),
                  ),
                  ...users.map(
                    (row) => DropdownMenuItem<int?>(
                      value: _id(row),
                      child: Text('${row['name'] ?? row['email'] ?? ''}'),
                    ),
                  ),
                ],
                onChanged: (value) => setState(() => _assigneeId = value),
              ),
              const SizedBox(height: 14),
              DropdownButtonFormField<int>(
                initialValue: _priorityId,
                decoration: const InputDecoration(labelText: 'Priority *'),
                items: priorities
                    .map(
                      (row) => DropdownMenuItem<int>(
                        value: _id(row),
                        child: _OptionLabel(
                          label: '${row['name'] ?? ''}',
                          color: _priorityColor(
                            '${row['code'] ?? row['name']}',
                          ),
                        ),
                      ),
                    )
                    .toList(),
                validator: (value) =>
                    value == null ? 'Choose a priority.' : null,
                onChanged: (value) => setState(() => _priorityId = value),
              ),
              const SizedBox(height: 14),
              DropdownButtonFormField<int>(
                initialValue: _statusId,
                decoration: const InputDecoration(labelText: 'Status *'),
                items: statuses
                    .map(
                      (row) => DropdownMenuItem<int>(
                        value: _id(row),
                        child: _OptionLabel(
                          label: '${row['name'] ?? ''}',
                          color: _statusColor('${row['code'] ?? row['name']}'),
                          ring: true,
                        ),
                      ),
                    )
                    .toList(),
                validator: (value) => value == null ? 'Choose a status.' : null,
                onChanged: (value) => setState(() => _statusId = value),
              ),
              const SizedBox(height: 14),
              ListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('Due date'),
                subtitle: Text(
                  _dueDate == null ? 'Not set' : _displayDate(_dueDate!),
                ),
                trailing: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    if (_dueDate != null)
                      IconButton(
                        tooltip: 'Clear due date',
                        onPressed: () => setState(() => _dueDate = null),
                        icon: const Icon(Icons.clear),
                      ),
                    IconButton(
                      tooltip: 'Choose due date',
                      onPressed: _chooseDueDate,
                      icon: const Icon(Icons.calendar_month_outlined),
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    ),
  );

  Future<void> _chooseDueDate() async {
    final now = DateTime.now();
    final selected = await showDatePicker(
      context: context,
      initialDate: _dueDate ?? now,
      firstDate: DateTime(now.year - 1),
      lastDate: DateTime(now.year + 10),
    );
    if (selected != null) setState(() => _dueDate = selected);
  }

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
        'title': _title.text.trim(),
        'description': _description.text.trim(),
        'listInId': _listId,
        'priorityId': _priorityId,
        'statusId': _statusId,
        'assignedUserId': _assigneeId,
        'dueDate': _dueDate == null ? null : _date(_dueDate!),
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

  static String _date(DateTime date) =>
      '${date.year.toString().padLeft(4, '0')}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';

  static String _displayDate(DateTime date) =>
      '${date.day.toString().padLeft(2, '0')}-${date.month.toString().padLeft(2, '0')}-${date.year}';

  static Color _priorityColor(String code) => switch (code.toLowerCase()) {
    'low' => const Color(0xFF03A9F4),
    'normal' => const Color(0xFF00BFA5),
    'high' => const Color(0xFFFF6D00),
    'urgent' => const Color(0xFFFF1744),
    _ => const Color(0xFF607D8B),
  };

  static Color _statusColor(String code) => switch (code.toLowerCase()) {
    'new' => const Color(0xFF2962FF),
    'open' => const Color(0xFF00A8E8),
    'won' || 'closed' || 'completed' => const Color(0xFF00B881),
    'lost' || 'rejected' => const Color(0xFFFF1744),
    'hold_for_approval' || 'hold for approval' => const Color(0xFFFF8F00),
    'long_hold' || 'long hold' => const Color(0xFF8E24FF),
    _ => const Color(0xFFFF6D00),
  };
}

class _OptionLabel extends StatelessWidget {
  const _OptionLabel({
    required this.label,
    required this.color,
    this.ring = false,
  });

  final String label;
  final Color color;
  final bool ring;

  @override
  Widget build(BuildContext context) => Row(
    mainAxisSize: MainAxisSize.min,
    children: [
      Container(
        width: 14,
        height: 14,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          border: ring ? Border.all(color: color, width: 1.8) : null,
          color: ring ? Colors.transparent : color,
        ),
        child: ring
            ? Center(
                child: Container(
                  width: 4,
                  height: 4,
                  decoration: BoxDecoration(
                    color: color,
                    shape: BoxShape.circle,
                  ),
                ),
              )
            : null,
      ),
      const SizedBox(width: 9),
      Text(label),
    ],
  );
}
