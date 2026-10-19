import 'dart:async';

import 'package:flutter/material.dart';

import '../../core/api/crm_mobile_api.dart';
import 'task_form_page.dart';
import 'work_action_sheet.dart';

class TasksPage extends StatefulWidget {
  const TasksPage({required this.api, required this.session, super.key});
  final CrmMobileApi api;
  final UserSession session;
  @override
  State<TasksPage> createState() => _TasksPageState();
}

class _TasksPageState extends State<TasksPage> with WidgetsBindingObserver {
  List<Map<String, dynamic>> _items = [];
  var _page = 1;
  var _total = 0;
  var _pageCount = 1;
  String? _error;
  Timer? _timer;
  bool _includeClosed = false;
  bool _canCreate = false;
  bool _loading = false;
  bool _initialLoad = true;
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _load();
    _loadCreatePermission();
    _startPolling();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _timer?.cancel();
    super.dispose();
  }

  Future<void> _load() async {
    if (_loading) return;
    _loading = true;
    try {
      final result = await widget.api.tasksPage(
        widget.session.accessToken,
        filter: _includeClosed ? "all" : "active",
        page: _page,
        pageSize: 100,
      );
      if (mounted)
        setState(() {
          _items = result.items;
          _page = result.page;
          _total = result.total;
          _pageCount = result.pageCount;
          _error = null;
        });
    } catch (error) {
      if (mounted) setState(() => _error = '$error');
    } finally {
      _loading = false;
      if (mounted && _initialLoad) setState(() => _initialLoad = false);
    }
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
    }
  }

  void _startPolling() {
    _timer ??= Timer.periodic(const Duration(seconds: 30), (_) => _load());
  }

  void _pausePolling() {
    _timer?.cancel();
    _timer = null;
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(
      title: const Text('Tasks'),
      actions: [
        if (_canCreate)
          IconButton(
            tooltip: 'New task',
            onPressed: _createTask,
            icon: const Icon(Icons.add_task_outlined),
          ),
        IconButton(
          tooltip: _includeClosed ? 'Show active tasks' : 'Show all tasks',
          onPressed: () {
            setState(() {
              _includeClosed = !_includeClosed;
              _page = 1;
            });
            _load();
          },
          icon: Icon(
            _includeClosed ? Icons.filter_alt : Icons.filter_alt_outlined,
          ),
        ),
        IconButton(onPressed: _load, icon: const Icon(Icons.refresh)),
      ],
    ),
    body: RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        children: [
          if (_initialLoad && _items.isEmpty)
            const SizedBox(
              height: 240,
              child: Center(child: CircularProgressIndicator()),
            ),
          if (_error != null)
            ListTile(
              leading: const Icon(Icons.cloud_off_outlined),
              title: const Text('Could not load tasks.'),
              subtitle: Text(_error!),
              trailing: IconButton(
                tooltip: 'Retry',
                onPressed: _load,
                icon: const Icon(Icons.refresh_rounded),
              ),
            ),
          if (!_initialLoad && _items.isEmpty && _error == null)
            const ListTile(title: Text('No active tasks.')),
          ..._items.map(
            (row) => ListTile(
              title: Text(normalizeCrmText('${row['title'] ?? ''}')),
              subtitle: Text(
                '${normalizeCrmText('${row['contactName'] ?? ''}')} · ${normalizeCrmText('${row['closurePending'] == true ? 'Closure pending' : row['statusName'] ?? ''}')}',
                style: row['closurePending'] == true
                    ? const TextStyle(color: Colors.orange)
                    : null,
              ),
              trailing: const Icon(Icons.chevron_right),
              onTap: () async {
                _pausePolling();
                await Navigator.of(context).push(
                  MaterialPageRoute<void>(
                    builder: (_) => _TaskDetail(
                      api: widget.api,
                      session: widget.session,
                      id: row['id'] as int,
                    ),
                  ),
                );
                await _load();
                _startPolling();
              },
            ),
          ),
          if (_total > 100)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              child: Row(
                children: [
                  Text('$_total tasks · Page $_page of $_pageCount'),
                  const Spacer(),
                  IconButton(
                    tooltip: 'Previous page',
                    onPressed: _page > 1
                        ? () {
                            setState(() => _page--);
                            _load();
                          }
                        : null,
                    icon: const Icon(Icons.chevron_left),
                  ),
                  IconButton(
                    tooltip: 'Next page',
                    onPressed: _page < _pageCount
                        ? () {
                            setState(() => _page++);
                            _load();
                          }
                        : null,
                    icon: const Icon(Icons.chevron_right),
                  ),
                ],
              ),
            ),
        ],
      ),
    ),
  );

  Future<void> _loadCreatePermission() async {
    try {
      final options = await widget.api.taskOptions(widget.session.accessToken);
      final capabilities = options['capabilities'] as Map<String, dynamic>?;
      if (mounted) setState(() => _canCreate = capabilities?['create'] == true);
    } catch (_) {
      // The task list remains available even if form capabilities cannot load.
    }
  }

  Future<void> _createTask() async {
    final created = await Navigator.of(context).push<bool>(
      MaterialPageRoute(
        builder: (_) => TaskFormPage(api: widget.api, session: widget.session),
      ),
    );
    if (created == true && mounted) await _load();
  }
}

class _TaskDetail extends StatefulWidget {
  const _TaskDetail({
    required this.api,
    required this.session,
    required this.id,
  });
  final CrmMobileApi api;
  final UserSession session;
  final int id;
  @override
  State<_TaskDetail> createState() => _TaskDetailState();
}

class _TaskDetailState extends State<_TaskDetail> with WidgetsBindingObserver {
  Map<String, dynamic>? _task;
  List<Map<String, dynamic>> _comments = [], _closures = [];
  String? _error;
  Timer? _timer;
  Timer? _jobClock;
  List<Map<String, dynamic>> _reports = [], _jobs = [];
  bool _checkedIn = false;
  DateTime _clockNow = DateTime.now();
  bool _loading = false;
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
      final data = await Future.wait([
        widget.api.task(widget.session.accessToken, widget.id),
        widget.api.taskComments(widget.session.accessToken, widget.id),
        widget.api.taskClosures(widget.session.accessToken, widget.id),
        widget.api.workReports(widget.session.accessToken, taskId: widget.id),
        widget.api.taskJobs(widget.session.accessToken, widget.id),
        widget.api.workCheckpoint(
          widget.session.accessToken,
          taskId: widget.id,
        ),
      ]);
      if (mounted)
        setState(() {
          _task = data[0] as Map<String, dynamic>;
          _comments = data[1] as List<Map<String, dynamic>>;
          _closures = data[2] as List<Map<String, dynamic>>;
          _reports = data[3] as List<Map<String, dynamic>>;
          _jobs = data[4] as List<Map<String, dynamic>>;
          _checkedIn = data[5] as bool;
          _error = null;
        });
      _syncJobClock();
    } catch (error) {
      if (mounted) setState(() => _error = '$error');
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
      taskPhone: '${_task?['contactPhone'] ?? ''}',
      isJobRunning: _jobs.any((job) => job['stoppedAt'] == null),
      jobStartedAt: _activeJobStart,
      checkedIn: _checkedIn,
      closurePending: _closures.any((row) => row['status'] == 'pending'),
      closed: _task?['status'] == 'closed',
    );
    if (saved && mounted) await _load();
  }

  @override
  Widget build(BuildContext context) {
    final pending = _closures.any((row) => row['status'] == 'pending');
    final contactName = normalizeCrmText(
      _task?['contactName']?.toString() ?? 'None',
    );
    final contactPhone = normalizeCrmText(
      _task?['contactPhone']?.toString() ?? '',
    );
    final statusName = normalizeCrmText(_task?['statusName']?.toString() ?? '');
    return Scaffold(
      floatingActionButton: FloatingActionButton(
        tooltip: 'Add action',
        onPressed: _task == null ? null : _openActions,
        child: const Icon(Icons.add),
      ),
      appBar: AppBar(
        title: Text(normalizeCrmText('${_task?['title'] ?? 'Task'}')),
        actions: [
          IconButton(onPressed: _load, icon: const Icon(Icons.refresh)),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          if (_error != null) Text(_error!),
          Text(normalizeCrmText('${_task?['description'] ?? ''}')),
          Text('Contact: $contactName $contactPhone'),
          Text('Status: $statusName'),
          if (pending)
            const Text(
              'Completion sent. Waiting for admin approval.',
              style: TextStyle(color: Colors.orange),
            ),
          if (_activeJobStart case final startedAt?)
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: const Icon(Icons.timer_outlined),
              title: const Text('Job running'),
              subtitle: Text(_formatElapsed(_clockNow.difference(startedAt))),
            ),
          if (_closures.isNotEmpty && _closures.first['status'] == 'rejected')
            Text(
              'Closure rejected: ${normalizeCrmText('${_closures.first['reviewNote'] ?? ''}')}',
            ),
          const SizedBox(height: 12),
          ..._reports.map(
            (row) => ListTile(
              title: Text(
                normalizeCrmText('${row['action']}').replaceAll('-', ' '),
              ),
              subtitle: Text(
                '${normalizeCrmText('${row['body'] ?? ''}')}${row['latitude'] == null ? '' : '\nGPS: ${row['latitude']}, ${row['longitude']} · ${row['accuracy_meters']} m'}',
              ),
            ),
          ),
          ..._comments.map(
            (row) => ListTile(
              title: Text(normalizeCrmText('${row['body'] ?? ''}')),
              subtitle: Text(
                '${normalizeCrmText('${row['createdBy'] ?? ''}')} · ${row['createdAt']}',
              ),
            ),
          ),
        ],
      ),
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

String _formatElapsed(Duration duration) {
  final seconds = duration.inSeconds < 0 ? 0 : duration.inSeconds;
  final hours = seconds ~/ 3600;
  final minutes = seconds % 3600 ~/ 60;
  final remainder = seconds % 60;
  return '${hours.toString().padLeft(2, '0')}:${minutes.toString().padLeft(2, '0')}:${remainder.toString().padLeft(2, '0')}';
}
