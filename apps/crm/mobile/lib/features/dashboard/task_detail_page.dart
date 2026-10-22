import 'dart:async';

import 'package:flutter/material.dart';

import '../../core/api/crm_mobile_api.dart';
import '../../core/api/mobile_request_outcome.dart';
import 'work_action_sheet.dart';
import 'work_timestamp_format.dart';
import 'work_charges_section.dart';
import 'task_detail_header.dart';

class TaskDetailPage extends StatefulWidget {
  const TaskDetailPage({
    required this.api,
    required this.session,
    required this.id,
    super.key,
  });
  final CrmMobileApi api;
  final UserSession session;
  final int id;
  @override
  State<TaskDetailPage> createState() => TaskDetailPageState();
}

class TaskDetailPageState extends State<TaskDetailPage>
    with WidgetsBindingObserver {
  Map<String, dynamic>? _task;
  List<Map<String, dynamic>> _comments = [], _closures = [];
  String? _error;
  Timer? _timer;
  Timer? _jobClock;
  List<Map<String, dynamic>> _reports = [], _jobs = [];
  bool _checkedIn = false;
  DateTime _clockNow = DateTime.now();
  bool _loading = false;
  String _section = 'comments';
  int _chargeVersion = 0;
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _load();
    _startPolling();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _timer?.cancel();
    _jobClock?.cancel();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _startPolling();
      _load();
    } else if (state == AppLifecycleState.paused ||
        state == AppLifecycleState.detached) {
      _timer?.cancel();
      _timer = null;
      _jobClock?.cancel();
      _jobClock = null;
    }
  }

  void _startPolling() {
    _timer ??= Timer.periodic(const Duration(seconds: 20), (_) => _load());
  }

  Future<void> _load() async {
    if (_loading) return;
    _loading = true;
    try {
      final task = await widget.api.task(widget.session.accessToken, widget.id);
      final results = await Future.wait([
        captureMobileRequest<List<Map<String, dynamic>>>(
          widget.api.taskComments(widget.session.accessToken, widget.id),
        ),
        captureMobileRequest<List<Map<String, dynamic>>>(
          widget.api.taskClosures(widget.session.accessToken, widget.id),
        ),
        captureMobileRequest<List<Map<String, dynamic>>>(
          widget.api.workReports(widget.session.accessToken, taskId: widget.id),
        ),
        captureMobileRequest<List<Map<String, dynamic>>>(
          widget.api.taskJobs(widget.session.accessToken, widget.id),
        ),
        captureMobileRequest<bool>(
          widget.api.workCheckpoint(
            widget.session.accessToken,
            taskId: widget.id,
          ),
        ),
      ]);
      if (mounted)
        setState(() {
          _task = task;
          if (results[0].succeeded) {
            _comments = results[0].value as List<Map<String, dynamic>>;
          }
          if (results[1].succeeded) {
            _closures = results[1].value as List<Map<String, dynamic>>;
          }
          if (results[2].succeeded) {
            _reports = results[2].value as List<Map<String, dynamic>>;
          }
          if (results[3].succeeded) {
            _jobs = results[3].value as List<Map<String, dynamic>>;
          }
          if (results[4].succeeded) _checkedIn = results[4].value as bool;
          _error = results.every((result) => result.succeeded)
              ? null
              : 'Some task details could not be refreshed. Tap retry.';
        });
      _syncJobClock();
    } catch (error) {
      if (mounted) {
        setState(() {
          _error = _task == null
              ? 'Could not load task: $error'
              : 'Task refresh failed: $error';
        });
      }
    } finally {
      _loading = false;
    }
  }

  Future<void> _openActions() async {
    final saved = await showWorkActionSheet(
      context: context,
      api: widget.api,
      session: widget.session,
      taskId: widget.id,
      taskStatusId: '${_task?['statusId'] ?? ''}',
      taskPhone: '${_task?['contactPhone'] ?? ''}',
      isJobRunning: _jobs.any((job) => job['stoppedAt'] == null),
      jobStartedAt: _activeJobStart,
      checkedIn: _checkedIn,
      closurePending: _closures.any((row) => row['status'] == 'pending'),
      closed: _task?['status'] == 'closed',
      onCollectionSaved: () => setState(() {
        _section = 'charges';
        _chargeVersion++;
      }),
    );
    if (saved && mounted) await _load();
  }

  @override
  Widget build(BuildContext context) {
    final pending = _closures.any((row) => row['status'] == 'pending');
    return Scaffold(
      floatingActionButton: FloatingActionButton(
        tooltip: 'Add action',
        onPressed: _task == null ? null : _openActions,
        child: const Icon(Icons.add_rounded),
      ),
      appBar: AppBar(
        title: Text('Task #${widget.id}'),
        actions: [
          PopupMenuButton<String>(
            tooltip: 'Task sections',
            onSelected: (value) {
              if (value == 'actions') {
                _openActions();
              } else {
                setState(() => _section = value);
              }
            },
            itemBuilder: (context) => const [
              PopupMenuItem(value: 'comments', child: Text('Comments')),
              PopupMenuItem(
                value: 'checkpoints',
                child: Text('Check in / out'),
              ),
              PopupMenuItem(value: 'jobs', child: Text('Jobs')),
              PopupMenuItem(value: 'charges', child: Text('Charges')),
              PopupMenuDivider(),
              PopupMenuItem(value: 'actions', child: Text('Actions')),
            ],
          ),
        ],
      ),
      body: Column(
        children: [
          if (_error != null)
            MaterialBanner(
              content: Text(_error!),
              leading: const Icon(Icons.cloud_off_outlined),
              actions: [
                TextButton(onPressed: _load, child: const Text('Retry')),
              ],
            ),
          if (_task != null)
            TaskDetailHeader(
              task: _task!,
              runningJobStartedAt: _activeJobStart,
              now: _clockNow,
            ),
          if (pending)
            const MaterialBanner(
              content: Text('Completion sent. Waiting for admin approval.'),
              leading: Icon(Icons.hourglass_top_rounded),
              actions: [SizedBox.shrink()],
            ),
          if (_closures.isNotEmpty && _closures.first['status'] == 'rejected')
            MaterialBanner(
              content: Text(
                'Completion rejected: ${normalizeCrmText('${_closures.first['reviewNote'] ?? ''}')}',
              ),
              leading: const Icon(Icons.info_outline),
              actions: const [SizedBox.shrink()],
            ),
          Expanded(child: _buildSection()),
        ],
      ),
    );
  }

  Widget _buildSection() {
    if (_section == 'charges') {
      return WorkChargesSection(
        key: ValueKey(_chargeVersion),
        api: widget.api,
        session: widget.session,
        taskId: widget.id,
      );
    }
    final rows = switch (_section) {
      'checkpoints' =>
        _reports
            .where((row) => ['check-in', 'check-out'].contains(row['action']))
            .toList(),
      'jobs' => _jobs,
      _ => _comments,
    };
    if (_loading && rows.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }
    if (rows.isEmpty) {
      return Center(
        child: Text(switch (_section) {
          'checkpoints' => 'No check in or out records yet.',
          'jobs' => 'No job records yet.',
          _ => 'No comments yet.',
        }),
      );
    }
    return ListView.separated(
      padding: const EdgeInsets.fromLTRB(18, 10, 18, 96),
      itemCount: rows.length,
      separatorBuilder: (context, index) => const Divider(height: 1),
      itemBuilder: (context, index) {
        final row = rows[index];
        if (_section == 'jobs') {
          final started = formatWorkTimestamps('${row['startedAt'] ?? ''}');
          final stopped = row['stoppedAt'] == null
              ? 'Running'
              : formatWorkTimestamps('${row['stoppedAt']}');
          final title = 'Job #${row['id'] ?? index + 1}';
          return ListTile(
            leading: const CircleAvatar(
              child: Icon(Icons.work_outline_rounded, size: 19),
            ),
            title: Text(
              title,
              style: const TextStyle(fontWeight: FontWeight.w700),
            ),
            subtitle: Text('Started: $started\nCompleted: $stopped'),
            isThreeLine: true,
            trailing: row['stoppedAt'] == null
                ? TaskRunningTimer(startedAt: _activeJobStart, now: _clockNow)
                : null,
          );
        }
        final isCheckpoint = _section == 'checkpoints';
        final body = isCheckpoint
            ? formatWorkTimestamps(
                '${row['action'] == 'check-in' ? 'Check in' : 'Check out'}\n'
                '${row['body'] ?? ''}'
                '${row['latitude'] == null ? '' : '\nGPS: ${row['latitude']}, ${row['longitude']} · ${row['accuracy_meters']} m'}'
                '${row['capturedAt'] == null ? '' : '\nCaptured @ ${row['capturedAt']}'}',
              )
            : normalizeCrmText('${row['body'] ?? ''}');
        return ListTile(
          leading: CircleAvatar(
            backgroundColor: const Color(0xFFF2E5FA),
            foregroundColor: const Color(0xFF662C90),
            child: Icon(
              isCheckpoint
                  ? Icons.location_on_outlined
                  : Icons.chat_bubble_outline,
              size: 19,
            ),
          ),
          title: Text(body),
          subtitle: Text(
            formatWorkTimestamps(
              '${row['createdBy'] ?? ''} · ${row['createdAt'] ?? ''}',
            ),
          ),
          isThreeLine: true,
        );
      },
    );
  }

  DateTime? get _activeJobStart {
    final job = _jobs.where((item) => item['stoppedAt'] == null).firstOrNull;
    if (job == null) return null;
    final raw = job['startedAt']?.toString();
    if (raw == null) return null;
    return DateTime.tryParse(raw.replaceFirst(' ', 'T'))?.toLocal();
  }

  void _syncJobClock() {
    if (_activeJobStart == null) {
      _jobClock?.cancel();
      _jobClock = null;
      return;
    }
    _jobClock ??= Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) setState(() => _clockNow = DateTime.now());
    });
  }
}
