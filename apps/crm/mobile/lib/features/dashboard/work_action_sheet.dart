import 'dart:async';
import 'dart:math';

import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';

import '../../core/api/crm_mobile_api.dart';
import '../../core/platform/mobile_actions.dart';

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
}) async =>
    await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      isDismissible: false,
      enableDrag: false,
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

  Future<void> _run(Future<void> Function() operation) async {
    if (_busy) return;
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await operation();
      _changed = true;
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

  Future<void> _addComment() async {
    final body = _comment.text.trim();
    if (body.isEmpty) {
      setState(() => _error = 'Enter a comment.');
      return;
    }
    await _run(() async {
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
    });
  }

  Future<void> _toggleCheckIn() async {
    final action = _checkedIn ? 'check-out' : 'check-in';
    await _run(() async {
      if (_retry?['action'] != action || _retry?['body'] != '') {
        _retry = null;
      }
      if (_retry == null) {
        final position = await _position();
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
      }
      await widget.api.sendWorkReport(widget.session.accessToken, _retry!);
      setState(() => _checkedIn = !_checkedIn);
      _retry = null;
    });
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
    });
  }

  Future<void> _openWhatsApp() async {
    final mobile = widget.taskId == null
        ? _enquiry?.mobile ?? ''
        : widget.taskPhone;
    if (mobile.trim().isEmpty) {
      setState(() => _error = 'No customer mobile number is available.');
      return;
    }
    await _run(() async {
      if (!await MobileActions.whatsApp(mobile)) {
        throw const CrmMobileApiException(
          'WhatsApp is not available on this device.',
        );
      }
    });
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
                TextField(
                  controller: _comment,
                  enabled: !_busy,
                  minLines: 2,
                  maxLines: 5,
                  textCapitalization: TextCapitalization.sentences,
                  decoration: const InputDecoration(
                    hintText: 'Write a comment…',
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 10),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    FilledButton.icon(
                      onPressed: _busy ? null : _addComment,
                      icon: const Icon(Icons.send_outlined),
                      label: const Text('Comment'),
                    ),
                    OutlinedButton.icon(
                      onPressed: _busy || _closed ? null : _toggleCheckIn,
                      icon: Icon(_checkedIn ? Icons.logout : Icons.login),
                      label: Text(_checkedIn ? 'Check out' : 'Check in'),
                    ),
                    OutlinedButton.icon(
                      onPressed: _busy || _closed ? null : _toggleJob,
                      icon: Icon(_jobRunning ? Icons.stop : Icons.play_arrow),
                      label: Text(_jobRunning ? 'Stop job' : 'Start job'),
                    ),
                    if (widget.taskId == null &&
                            (_enquiry?.mobile.trim().isNotEmpty ?? false) ||
                        widget.taskId != null &&
                            widget.taskPhone.trim().isNotEmpty)
                      OutlinedButton.icon(
                        onPressed: _busy ? null : _openWhatsApp,
                        icon: const Icon(Icons.chat_outlined),
                        label: const Text('WhatsApp'),
                      ),
                    if (!_closed)
                      OutlinedButton.icon(
                        onPressed: _busy || _closurePending
                            ? null
                            : _requestClosure,
                        icon: const Icon(Icons.notifications_active_outlined),
                        label: Text(
                          _closurePending
                              ? 'Closure pending'
                              : 'Request closure',
                        ),
                      ),
                  ],
                ),
                if (_jobRunning) ...[
                  const SizedBox(height: 12),
                  _ActionStatus(
                    icon: Icons.timer_outlined,
                    text: 'Job running · ${_durationLabel(_elapsed)}',
                  ),
                ],
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
                const SizedBox(height: 18),
                Align(
                  alignment: Alignment.centerRight,
                  child: FilledButton.tonal(
                    onPressed: _busy
                        ? null
                        : () => Navigator.pop(context, _changed),
                    child: const Text('Done'),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
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
