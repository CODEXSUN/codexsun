import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../services/portal_api.dart';
import '../services/portal_socket.dart';
import 'requirement_form.dart';

class WorkspaceScreen extends StatefulWidget {
  const WorkspaceScreen({super.key, required this.api, required this.onLogout});
  final PortalApi api;
  final VoidCallback onLogout;
  @override
  State<WorkspaceScreen> createState() => _WorkspaceScreenState();
}

class _WorkspaceScreenState extends State<WorkspaceScreen> {
  late final PortalSocket socket;
  final message = TextEditingController();
  List<Map<String, dynamic>> records = [];
  String error = '';
  bool loading = true;
  @override
  void initState() {
    super.initState();
    socket = PortalSocket(widget.api, refresh)
      ..addListener(update)
      ..connect();
    refresh();
    registerDevice();
  }

  void update() {
    if (mounted) setState(() {});
  }

  Future<void> registerDevice() async {
    if (!widget.api.can('codexsun.devices.manage')) return;
    try {
      final key = await const MethodChannel('codexsun.codexsun/device')
          .invokeMethod<String>('deviceKey');
      if (key == null) throw Exception('Device registration is unavailable.');
      await widget.api.post('/codexsun/devices', {
        'deviceKey': key,
        'kind': 'mobile',
        'label': 'CODEXSUN Android',
      });
    } catch (cause) {
      if (mounted) setState(() => error = cause.toString());
    }
  }

  Future<void> refresh() async {
    try {
      final page = await widget.api.get('/codexsun/requirements?pageSize=100');
      if (mounted) {
        setState(() {
          records = List<Map<String, dynamic>>.from(page['records']);
          loading = false;
          error = '';
        });
      }
    } catch (cause) {
      if (mounted) {
        setState(() {
          error = cause.toString();
          loading = false;
        });
      }
    }
  }

  Future<void> action(Map<String, dynamic> record, String operation) async {
    try {
      await widget.api.post(
        '/codexsun/requirements/${record['uuid']}/${operation == 'submit' ? 'submit' : 'decision'}',
        {
          'revision': record['revision'],
          if (operation != 'submit') 'decision': operation,
          if (operation != 'submit') 'note': 'Reviewed in CODEXSUN mobile',
        },
      );
      await refresh();
    } catch (cause) {
      if (mounted) setState(() => error = cause.toString());
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(
      title: const Text('Zuno · Mobile'),
      actions: [
        IconButton(
          tooltip: 'Refresh',
          onPressed: refresh,
          icon: const Icon(Icons.refresh),
        ),
        IconButton(
          tooltip: 'Sign out',
          onPressed: () async {
            await widget.api.logout();
            if (mounted) widget.onLogout();
          },
          icon: const Icon(Icons.logout),
        ),
      ],
    ),
    body: RefreshIndicator(
      onRefresh: refresh,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(
            '${widget.api.context?['tenantName']} · ${widget.api.context?['actorEmail']}',
            style: Theme.of(context).textTheme.bodySmall,
          ),
          const SizedBox(height: 12),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Text(
                    'Device communication',
                    style: TextStyle(fontWeight: FontWeight.w600),
                  ),
                  Text(socket.status, key: const Key('socket-status')),
                  const SizedBox(height: 12),
                  TextField(
                    key: const Key('device-message'),
                    controller: message,
                    maxLength: 240,
                    decoration: const InputDecoration(
                      labelText: 'Device message',
                    ),
                  ),
                  Row(
                    children: [
                      Expanded(
                        child: FilledButton(
                          key: const Key('send-message'),
                          onPressed: socket.connected
                              ? () {
                                  socket.signal(message.text);
                                  message.clear();
                                }
                              : null,
                          child: const Text('Send message'),
                        ),
                      ),
                      const SizedBox(width: 8),
                      OutlinedButton(
                        key: const Key('ping-server'),
                        onPressed: socket.connected ? socket.ping : null,
                        child: const Text('Ping server'),
                      ),
                    ],
                  ),
                  if (socket.acknowledgement.isNotEmpty)
                    Text(socket.acknowledgement),
                  ...socket.messages.map(
                    (value) => Padding(
                      padding: const EdgeInsets.only(top: 8),
                      child: Text(value),
                    ),
                  ),
                ],
              ),
            ),
          ),
          if (error.isNotEmpty)
            Text(
              error,
              style: TextStyle(color: Theme.of(context).colorScheme.error),
            ),
          if (loading) const LinearProgressIndicator(),
          const SizedBox(height: 12),
          const Text(
            'Requirements',
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.w600),
          ),
          if (records.isEmpty && !loading) const Text('No requirements yet.'),
          ...records.map(
            (record) => Card(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      record['title'],
                      style: const TextStyle(fontWeight: FontWeight.w600),
                    ),
                    Text(
                      '${record['status']} · revision ${record['revision']}',
                    ),
                    Text(
                      record['description'],
                      maxLines: 3,
                      overflow: TextOverflow.ellipsis,
                    ),
                    if (record['status'] == 'draft' &&
                        record['createdBy'] ==
                            widget.api.context?['actorEmail'] &&
                        widget.api.can('codexsun.requirements.update'))
                      TextButton(
                        onPressed: () => action(record, 'submit'),
                        child: const Text('Send for approval'),
                      ),
                    if (record['status'] == 'awaiting_approval' &&
                        widget.api.can('codexsun.requirements.approve'))
                      Row(
                        children: [
                          TextButton(
                            onPressed: () => action(record, 'approved'),
                            child: const Text('Approve'),
                          ),
                          TextButton(
                            onPressed: () => action(record, 'rejected'),
                            child: const Text('Reject'),
                          ),
                        ],
                      ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    ),
    floatingActionButton: widget.api.can('codexsun.requirements.create')
        ? FloatingActionButton.extended(
            key: const Key('new-requirement'),
            label: const Text('New idea'),
            icon: const Icon(Icons.add),
            onPressed: () async {
              await Navigator.of(context).push(
                MaterialPageRoute<void>(
                  builder: (_) => RequirementForm(api: widget.api),
                ),
              );
              await refresh();
            },
          )
        : null,
  );
  @override
  void dispose() {
    socket.removeListener(update);
    socket.dispose();
    message.dispose();
    super.dispose();
  }
}
