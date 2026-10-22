import 'dart:async';
import 'dart:math';

import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';

import '../../core/api/crm_mobile_api.dart';

Future<bool> showWorkActionSheet({
  required BuildContext context,
  required CrmMobileApi api,
  required UserSession session,
  List<CrmJob> enquiries = const [],
  int? taskId,
  String taskPhone = '',
  bool isJobRunning = false,
  DateTime? jobStartedAt,
  bool checkedIn = false,
  bool closurePending = false,
  bool closed = false,
  Future<Position> Function()? capturePosition,
  ValueChanged<CrmJob>? onEnquiryUpdated,
}) async =>
    await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      isDismissible: true,
      enableDrag: true,
      useSafeArea: true,
      constraints: const BoxConstraints(maxWidth: 560),
      builder: (_) => WorkActionSheet(
        api: api,
        session: session,
        enquiries: enquiries,
        taskId: taskId,
        taskPhone: taskPhone,
        isJobRunning: isJobRunning,
        jobStartedAt: jobStartedAt,
        checkedIn: checkedIn,
        closurePending: closurePending,
        closed: closed,
        capturePosition: capturePosition,
        onEnquiryUpdated: onEnquiryUpdated,
      ),
    ) ??
    false;

class WorkActionSheet extends StatefulWidget {
  const WorkActionSheet({
    required this.api,
    required this.session,
    this.enquiries = const [],
    this.taskId,
    this.taskPhone = '',
    this.isJobRunning = false,
    this.jobStartedAt,
    this.checkedIn = false,
    this.closurePending = false,
    this.closed = false,
    this.capturePosition,
    this.onEnquiryUpdated,
    super.key,
  });

  final CrmMobileApi api;
  final UserSession session;
  final List<CrmJob> enquiries;
  final int? taskId;
  final String taskPhone;
  final bool isJobRunning;
  final DateTime? jobStartedAt;
  final bool checkedIn;
  final bool closurePending;
  final bool closed;
  final Future<Position> Function()? capturePosition;
  final ValueChanged<CrmJob>? onEnquiryUpdated;

  @override
  State<WorkActionSheet> createState() => _WorkActionSheetState();
}

class _WorkActionSheetState extends State<WorkActionSheet> {
  final _comment = TextEditingController();
  CrmJob? _enquiry;
  late bool _jobRunning;
  late bool _checkedIn = widget.checkedIn;
  late bool _closurePending = widget.closurePending;
  late final bool _closed = widget.closed;
  DateTime? _jobStartedAt;
  Timer? _timer;
  bool _busy = false;
  bool _changed = false;
  String? _error;
  Map<String, dynamic>? _retry;

  @override
  void initState() {
    super.initState();
    _enquiry = widget.enquiries.firstOrNull;
    _jobRunning =
        widget.isJobRunning ||
        (_enquiry?.jobs.any((job) => job.isRunning) ?? false);
    _jobStartedAt = widget.jobStartedAt ?? _runningEnquiryStart();
    _syncTimer();
  }

  @override
  void dispose() {
    _timer?.cancel();
    _comment.dispose();
    super.dispose();
  }

  DateTime? _runningEnquiryStart() {
    final execution = _enquiry?.jobs.where((job) => job.isRunning).firstOrNull;
    if (execution == null) return null;
    final time = execution.startTime;
    final date = execution.date;
    if (time.contains('T')) return DateTime.tryParse(time)?.toLocal();
    final parsedDate = DateTime.tryParse(date ?? '');
    final match = RegExp(r'^(\d{1,2}):(\d{2})(?::(\d{2}))?').firstMatch(time);
    if (parsedDate == null || match == null)
      return execution.createdAt.toLocal();
    return DateTime(
      parsedDate.year,
      parsedDate.month,
      parsedDate.day,
      int.parse(match.group(1)!),
      int.parse(match.group(2)!),
      int.parse(match.group(3) ?? '0'),
    );
  }

  void _syncTimer() {
    if (!_jobRunning) {
      _timer?.cancel();
      _timer = null;
    } else {
      _jobStartedAt ??= DateTime.now();
      _timer ??= Timer.periodic(const Duration(seconds: 1), (_) {
        if (mounted) setState(() {});
      });
    }
  }

  Duration get _elapsed => _jobStartedAt == null
      ? Duration.zero
      : DateTime.now().difference(_jobStartedAt!);

  Future<Position> _position() async {
    if (widget.capturePosition != null) return widget.capturePosition!();
    if (!await Geolocator.isLocationServiceEnabled()) {
      throw const CrmMobileApiException('Turn on device location.');
    }
    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }
    if (permission == LocationPermission.denied ||
        permission == LocationPermission.deniedForever) {
      throw const CrmMobileApiException(
        'Allow location access to check in or out.',
      );
    }
    return Geolocator.getCurrentPosition(
      locationSettings: const LocationSettings(
        accuracy: LocationAccuracy.high,
        timeLimit: Duration(seconds: 20),
      ),
    );
  }

  Future<bool> _run(
    Future<void> Function() operation, {
    bool closeOnSuccess = false,
  }) async {
    if (_busy) return false;
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await operation();
      _changed = true;
      if (closeOnSuccess && mounted) Navigator.pop(context, true);
      return true;
    } catch (error) {
      if (mounted) {
        setState(
          () => _error = error is CrmMobileApiException
              ? error.message
              : '$error',
        );
      }
      return false;
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<bool> _addComment() async {
    final body = _comment.text.trim();
    if (body.isEmpty) {
      setState(() => _error = 'Enter a comment.');
      return false;
    }
    return _run(() async {
      if (widget.taskId != null) {
        await widget.api.addTaskComment(
          widget.session.accessToken,
          widget.taskId!,
          body,
        );
      } else {
        await widget.api.addJobComment(
          accessToken: widget.session.accessToken,
          id: _enquiry!.sourceId,
          comment: body,
        );
      }
      _comment.clear();
    });
  }

  Future<void> _openCommentComposer() async {
    final body = await showModalBottomSheet<String>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      showDragHandle: true,
      builder: (_) => const _CommentComposerSheet(),
    );
    if (!mounted || body == null || body.trim().isEmpty) return;
    _comment.text = body.trim();
    if (await _addComment() && mounted) {
      Navigator.pop(context, _changed);
    }
  }

  Future<void> _toggleJob() async {
    await _run(() async {
      if (_jobRunning) {
        if (widget.taskId != null) {
          await widget.api.stopTaskJob(
            widget.session.accessToken,
            widget.taskId!,
          );
        } else {
          final running = _enquiry!.jobs
              .where((job) => job.isRunning)
              .firstOrNull;
          if (running == null)
            throw const CrmMobileApiException('Running job was not found.');
          _enquiry = await widget.api.stopJob(
            accessToken: widget.session.accessToken,
            id: _enquiry!.sourceId,
            jobName: running.name,
          );
        }
        setState(() => _jobRunning = false);
      } else {
        if (widget.taskId != null) {
          await widget.api.startTaskJob(
            widget.session.accessToken,
            widget.taskId!,
          );
        } else {
          _enquiry = await widget.api.startJob(
            accessToken: widget.session.accessToken,
            id: _enquiry!.sourceId,
          );
        }
        setState(() {
          _jobRunning = true;
          _jobStartedAt = DateTime.now();
        });
      }
      _syncTimer();
      if (widget.taskId == null && _enquiry != null) {
        widget.onEnquiryUpdated?.call(_enquiry!);
      }
    }, closeOnSuccess: true);
  }

  Future<void> _toggleCheckIn() async {
    final action = _checkedIn ? 'check-out' : 'check-in';
    if (_retry?['action'] != action) _retry = null;
    if (_retry == null) {
      setState(() {
        _busy = true;
        _error = null;
      });
      try {
        final position = await _position();
        if (!mounted) return;
        _retry = {
          'enquiryId': widget.taskId == null ? _enquiry!.id : null,
          'taskId': widget.taskId,
          'action': action,
          'body': '',
          'amount': null,
          'requestId':
              'mobile-${DateTime.now().microsecondsSinceEpoch}-${Random.secure().nextInt(0x7fffffff)}',
          'latitude': position.latitude,
          'longitude': position.longitude,
          'accuracyMeters': position.accuracy,
          'capturedAt': position.timestamp.toUtc().toIso8601String(),
        };
      } catch (error) {
        if (mounted) {
          setState(
            () => _error = error is CrmMobileApiException
                ? error.message
                : '$error',
          );
        }
      } finally {
        if (mounted) setState(() => _busy = false);
      }
    }
    if (!mounted || _retry == null) return;

    final retry = _retry!;
    final body = await showModalBottomSheet<String>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      showDragHandle: true,
      builder: (_) => _CheckInComposerSheet(
        title: action == 'check-in' ? 'Check in' : 'Check out',
        latitude: retry['latitude'] as num,
        longitude: retry['longitude'] as num,
        accuracyMeters: retry['accuracyMeters'] as num,
        initialValue: '${retry['body'] ?? ''}',
      ),
    );
    if (!mounted || body == null) return;
    if (body != retry['body']) {
      retry['body'] = body;
      retry['requestId'] =
          'mobile-${DateTime.now().microsecondsSinceEpoch}-${Random.secure().nextInt(0x7fffffff)}';
    }

    await _run(() async {
      await widget.api.sendWorkReport(widget.session.accessToken, _retry!);
      setState(() => _checkedIn = !_checkedIn);
      _retry = null;
    }, closeOnSuccess: true);
  }

  Future<void> _requestClosure() async {
    await _run(() async {
      if (widget.taskId != null) {
        await widget.api.requestTaskClosure(
          widget.session.accessToken,
          widget.taskId!,
          reason: 'Closure requested from mobile.',
        );
      } else {
        await widget.api.requestClosure(
          accessToken: widget.session.accessToken,
          id: _enquiry!.sourceId,
          note: '',
        );
      }
      setState(() => _closurePending = true);
    }, closeOnSuccess: true);
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Padding(
        padding: EdgeInsets.fromLTRB(
          20,
          4,
          20,
          MediaQuery.viewInsetsOf(context).bottom + 16,
        ),
        child: ConstrainedBox(
          constraints: BoxConstraints(
            maxHeight: MediaQuery.sizeOf(context).height * .84,
          ),
          child: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text('Actions', style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 16),
                if (widget.enquiries.length > 1) ...[
                  DropdownButtonFormField<CrmJob>(
                    initialValue: _enquiry,
                    isExpanded: true,
                    decoration: const InputDecoration(labelText: 'Enquiry'),
                    items: widget.enquiries
                        .map(
                          (job) => DropdownMenuItem(
                            value: job,
                            child: Text(
                              '#${job.number} · ${job.title}',
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        )
                        .toList(),
                    onChanged: _busy
                        ? null
                        : (job) => setState(() => _enquiry = job),
                  ),
                  const SizedBox(height: 12),
                ],
                _WorkActionMenuItem(
                  key: const ValueKey('work-action-comment'),
                  icon: Icons.chat_bubble_outline,
                  title: 'Comment',
                  onTap: _busy ? null : _openCommentComposer,
                ),
                _WorkActionMenuItem(
                  icon: _checkedIn ? Icons.logout : Icons.login,
                  title: _checkedIn ? 'Check out' : 'Check in',
                  onTap: _busy || _closed ? null : _toggleCheckIn,
                ),
                _WorkActionMenuItem(
                  icon: _jobRunning ? Icons.stop : Icons.play_arrow,
                  title: _jobRunning ? 'Stop Job' : 'Start Job',
                  trailing: _jobRunning
                      ? _RunningTimerBadge(duration: _elapsed)
                      : null,
                  onTap: _busy || _closed ? null : _toggleJob,
                ),
                if (!_closed)
                  _WorkActionMenuItem(
                    icon: Icons.notifications_active_outlined,
                    title: _closurePending
                        ? 'Completion pending'
                        : 'Mark Complete',
                    onTap: _busy || _closurePending ? null : _requestClosure,
                  ),
                if (_checkedIn) ...[
                  const SizedBox(height: 8),
                  const _ActionStatus(
                    icon: Icons.location_on_outlined,
                    text: 'Checked in',
                  ),
                ],
                if (_error != null) ...[
                  const SizedBox(height: 10),
                  Text(
                    _error!,
                    style: TextStyle(
                      color: Theme.of(context).colorScheme.error,
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _WorkActionMenuItem extends StatelessWidget {
  const _WorkActionMenuItem({
    required this.icon,
    required this.title,
    this.trailing,
    required this.onTap,
    super.key,
  });

  final IconData icon;
  final String title;
  final Widget? trailing;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) => ListTile(
    contentPadding: EdgeInsets.zero,
    leading: Icon(icon, color: const Color(0xFF5F5266)),
    title: Text(title),
    trailing: trailing,
    onTap: onTap,
  );
}

class _RunningTimerBadge extends StatelessWidget {
  const _RunningTimerBadge({required this.duration});

  final Duration duration;

  @override
  Widget build(BuildContext context) => Container(
    key: const ValueKey('work-action-running-timer'),
    padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
    decoration: BoxDecoration(
      color: const Color(0xFFF1E4F8),
      borderRadius: BorderRadius.circular(16),
    ),
    child: Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        const Icon(Icons.timer_outlined, size: 14),
        const SizedBox(width: 4),
        Text(_durationLabel(duration)),
      ],
    ),
  );
}

class _CommentComposerSheet extends StatefulWidget {
  const _CommentComposerSheet();

  @override
  State<_CommentComposerSheet> createState() => _CommentComposerSheetState();
}

class _CommentComposerSheetState extends State<_CommentComposerSheet> {
  final _controller = TextEditingController();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Padding(
    padding: EdgeInsets.fromLTRB(
      20,
      8,
      20,
      MediaQuery.viewInsetsOf(context).bottom + 20,
    ),
    child: Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text('Comment', style: Theme.of(context).textTheme.titleMedium),
        const SizedBox(height: 14),
        TextField(
          key: const ValueKey('work-action-comment-input'),
          controller: _controller,
          autofocus: true,
          minLines: 4,
          maxLines: 7,
          onChanged: (_) => setState(() {}),
          textCapitalization: TextCapitalization.sentences,
          decoration: const InputDecoration(
            hintText: 'Write a comment…',
            border: OutlineInputBorder(),
          ),
        ),
        const SizedBox(height: 14),
        Align(
          alignment: Alignment.centerRight,
          child: FilledButton.icon(
            key: const ValueKey('work-action-comment-submit'),
            onPressed: _controller.text.trim().isEmpty
                ? null
                : () => Navigator.of(context).pop(_controller.text.trim()),
            icon: const Icon(Icons.send_outlined),
            label: const Text('Submit'),
          ),
        ),
      ],
    ),
  );
}

class _CheckInComposerSheet extends StatefulWidget {
  const _CheckInComposerSheet({
    required this.title,
    required this.latitude,
    required this.longitude,
    required this.accuracyMeters,
    required this.initialValue,
  });

  final String title;
  final num latitude;
  final num longitude;
  final num accuracyMeters;
  final String initialValue;

  @override
  State<_CheckInComposerSheet> createState() => _CheckInComposerSheetState();
}

class _CheckInComposerSheetState extends State<_CheckInComposerSheet> {
  late final _controller = TextEditingController(text: widget.initialValue);

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Padding(
    padding: EdgeInsets.fromLTRB(
      20,
      8,
      20,
      MediaQuery.viewInsetsOf(context).bottom + 20,
    ),
    child: Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(widget.title, style: Theme.of(context).textTheme.titleMedium),
        const SizedBox(height: 14),
        Container(
          key: const ValueKey('work-action-captured-location'),
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Theme.of(context).colorScheme.surfaceContainerHighest,
            borderRadius: BorderRadius.circular(10),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Icon(Icons.location_on_outlined),
              const SizedBox(width: 8),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Captured location'),
                    const SizedBox(height: 4),
                    SelectableText(
                      'GPS: ${widget.latitude}, ${widget.longitude}',
                      key: const ValueKey('work-action-location-coordinates'),
                    ),
                    Text(
                      'Accuracy: ${widget.accuracyMeters.toStringAsFixed(1)} m',
                      key: const ValueKey('work-action-location-accuracy'),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 14),
        TextField(
          key: const ValueKey('work-action-check-in-input'),
          controller: _controller,
          autofocus: true,
          minLines: 3,
          maxLines: 6,
          textCapitalization: TextCapitalization.sentences,
          decoration: const InputDecoration(
            hintText: 'Add a note (optional)',
            border: OutlineInputBorder(),
          ),
        ),
        const SizedBox(height: 14),
        Align(
          alignment: Alignment.centerRight,
          child: FilledButton.icon(
            key: const ValueKey('work-action-check-in-submit'),
            onPressed: () => Navigator.of(context).pop(_controller.text.trim()),
            icon: const Icon(Icons.send_outlined),
            label: const Text('Submit'),
          ),
        ),
      ],
    ),
  );
}

class _ActionStatus extends StatelessWidget {
  const _ActionStatus({required this.icon, required this.text});
  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
    decoration: BoxDecoration(
      color: Theme.of(context).colorScheme.surfaceContainerHighest,
      borderRadius: BorderRadius.circular(10),
    ),
    child: Row(
      mainAxisSize: MainAxisSize.min,
      children: [Icon(icon, size: 17), const SizedBox(width: 7), Text(text)],
    ),
  );
}

String _durationLabel(Duration duration) {
  final seconds = duration.inSeconds < 0 ? 0 : duration.inSeconds;
  final hours = seconds ~/ 3600;
  final minutes = seconds % 3600 ~/ 60;
  final remainder = seconds % 60;
  return '${hours.toString().padLeft(2, '0')}:${minutes.toString().padLeft(2, '0')}:${remainder.toString().padLeft(2, '0')}';
}
