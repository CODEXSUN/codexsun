import 'dart:math';

import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';

import '../../core/api/crm_mobile_api.dart';
import '../../core/platform/mobile_actions.dart';
import 'action_form_drawer.dart';

enum WorkAction {
  report,
  startJob,
  stopJob,
  checkIn,
  checkOut,
  takePhoto,
  scanDocument,
  logLocation,
  markCompleted,
  charges,
  collected,
}

extension WorkActionLabel on WorkAction {
  String get label => switch (this) {
    WorkAction.report => 'Report actions',
    WorkAction.startJob => 'Start job',
    WorkAction.stopJob => 'Stop job',
    WorkAction.checkIn => 'Check in',
    WorkAction.checkOut => 'Check out',
    WorkAction.takePhoto => 'Take photo',
    WorkAction.scanDocument => 'Scan document',
    WorkAction.logLocation => 'Log location',
    WorkAction.markCompleted => 'Mark completed',
    WorkAction.charges => 'Charges',
    WorkAction.collected => 'Collected Rs.',
  };
}

Future<bool> showWorkActionSheet({
  required BuildContext context,
  required CrmMobileApi api,
  required UserSession session,
  List<CrmJob> enquiries = const [],
  int? taskId,
  bool isJobRunning = false,
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
        isJobRunning: isJobRunning,
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
    this.isJobRunning = false,
    this.closurePending = false,
    this.closed = false,
    this.capturePosition,
    super.key,
  });
  final CrmMobileApi api;
  final UserSession session;
  final List<CrmJob> enquiries;
  final int? taskId;
  final bool isJobRunning, closurePending, closed;
  final Future<Position> Function()? capturePosition;
  @override
  State<WorkActionSheet> createState() => _WorkActionSheetState();
}

class _WorkActionSheetState extends State<WorkActionSheet> {
  final _body = TextEditingController(), _amount = TextEditingController();
  WorkAction _action = WorkAction.report;
  CrmJob? _enquiry;
  bool _busy = false;
  String? _error;
  Map<String, dynamic>? _retry;
  @override
  void initState() {
    super.initState();
    _enquiry = widget.enquiries.firstOrNull;
  }

  @override
  void dispose() {
    _body.dispose();
    _amount.dispose();
    super.dispose();
  }

  bool get _running =>
      _enquiry?.jobs.any((job) => job.isRunning) ?? widget.isJobRunning;
  bool get _money =>
      _action == WorkAction.charges || _action == WorkAction.collected;
  Future<Position> _position() async {
    if (widget.capturePosition != null) return widget.capturePosition!();
    if (!await Geolocator.isLocationServiceEnabled())
      throw Exception('Turn on device location.');
    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied)
      permission = await Geolocator.requestPermission();
    if (permission == LocationPermission.denied ||
        permission == LocationPermission.deniedForever)
      throw Exception('Allow location access to check in or out.');
    return Geolocator.getCurrentPosition(
      locationSettings: const LocationSettings(
        accuracy: LocationAccuracy.high,
        timeLimit: Duration(seconds: 20),
      ),
    );
  }

  Future<void> _saveReport(
    String action,
    String body, {
    bool gps = false,
  }) async {
    if (_retry?['action'] != action || _retry?['body'] != body) _retry = null;
    if (_retry == null) {
      final position = gps ? await _position() : null;
      _retry = {
        'enquiryId': _enquiry?.id,
        'taskId': widget.taskId,
        'action': action,
        'body': body,
        'requestId':
            'mobile-${DateTime.now().microsecondsSinceEpoch}-${Random.secure().nextInt(0x7fffffff)}',
        'latitude': position?.latitude,
        'longitude': position?.longitude,
        'accuracyMeters': position?.accuracy,
        'capturedAt': position?.timestamp.toUtc().toIso8601String(),
      };
    }
    await widget.api.sendWorkReport(widget.session.accessToken, _retry!);
  }

  Future<void> _confirm() async {
    final body = _body.text.trim();
    if (_action == WorkAction.report && body.isEmpty) {
      setState(() => _error = 'Enter the actions taken.');
      return;
    }
    if (_money && (double.tryParse(_amount.text.trim()) ?? 0) <= 0) {
      setState(() => _error = 'Enter an amount greater than zero.');
      return;
    }
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      final token = widget.session.accessToken;
      switch (_action) {
        case WorkAction.report:
          await _saveReport('report', body);
        case WorkAction.checkIn:
          await _saveReport('check-in', body, gps: true);
        case WorkAction.checkOut:
          await _saveReport('check-out', body, gps: true);
        case WorkAction.logLocation:
          await _saveReport(
            'report',
            body.isEmpty ? 'Location logged from mobile.' : body,
            gps: true,
          );
        case WorkAction.charges:
        case WorkAction.collected:
          await _saveReport(
            'report',
            '${_action == WorkAction.charges ? 'Charges' : 'Collected'}: ₹${_amount.text.trim()}${body.isEmpty ? '' : '\n$body'}',
          );
        case WorkAction.startJob:
          if (widget.taskId != null) {
            await widget.api.startTaskJob(token, widget.taskId!);
          } else {
            await widget.api.startJob(
              accessToken: token,
              id: _enquiry!.sourceId,
            );
          }
        case WorkAction.stopJob:
          if (widget.taskId != null) {
            await widget.api.stopTaskJob(token, widget.taskId!);
          } else {
            final running = _enquiry!.jobs.firstWhere((job) => job.isRunning);
            await widget.api.stopJob(
              accessToken: token,
              id: _enquiry!.sourceId,
              jobName: running.name,
            );
          }
        case WorkAction.markCompleted:
          if (widget.taskId != null) {
            await widget.api.requestTaskClosure(
              token,
              widget.taskId!,
              reason: body.isEmpty ? 'Completed from mobile.' : body,
            );
          } else {
            await widget.api.requestClosure(
              accessToken: token,
              id: _enquiry!.sourceId,
              note: body,
            );
          }
        case WorkAction.takePhoto:
        case WorkAction.scanDocument:
          final opened = await (_action == WorkAction.takePhoto
              ? MobileActions.photo()
              : MobileActions.scanDocument());
          if (!opened)
            throw Exception('${_action.label} is unavailable on this device.');
          await _saveReport(
            'report',
            body.isEmpty ? '${_action.label} opened from mobile.' : body,
          );
      }
      if (mounted) Navigator.pop(context, true);
    } catch (error) {
      if (mounted)
        setState(
          () => _error = error is CrmMobileApiException
              ? error.message
              : '$error',
        );
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final options = WorkAction.values.where(
      (action) =>
          action != (_running ? WorkAction.startJob : WorkAction.stopJob) &&
          (!(widget.closed || widget.closurePending) ||
              action != WorkAction.markCompleted),
    );
    return ActionFormDrawer(
      action: _action.name,
      actions: options
          .map(
            (action) =>
                DropdownMenuItem(value: action.name, child: Text(action.label)),
          )
          .toList(),
      onActionChanged: (value) {
        if (value != null)
          setState(() {
            _action = WorkAction.values.byName(value);
            _error = null;
            _retry = null;
          });
      },
      busy: _busy,
      error: _error,
      onConfirm: _confirm,
      form: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (widget.enquiries.length > 1) ...[
            DropdownButtonFormField<CrmJob>(
              initialValue: _enquiry,
              isExpanded: true,
              decoration: const InputDecoration(
                labelText: 'Enquiry',
                border: OutlineInputBorder(),
              ),
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
                  : (job) => setState(() {
                      _enquiry = job;
                      _retry = null;
                      _error = null;
                    }),
            ),
            const SizedBox(height: 16),
          ],
          if (_money) ...[
            TextField(
              controller: _amount,
              enabled: !_busy,
              keyboardType: const TextInputType.numberWithOptions(
                decimal: true,
              ),
              decoration: const InputDecoration(
                labelText: 'Amount',
                prefixText: '₹ ',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 16),
          ],
          if (_action == WorkAction.startJob || _action == WorkAction.stopJob)
            Text(
              _action == WorkAction.startJob
                  ? 'Start the work timer for this record.'
                  : 'Stop the running work timer.',
            )
          else
            TextField(
              controller: _body,
              enabled: !_busy,
              minLines: 3,
              maxLines: 5,
              textCapitalization: TextCapitalization.sentences,
              decoration: InputDecoration(
                labelText: _action == WorkAction.report
                    ? 'Actions taken'
                    : 'Notes (optional)',
                border: const OutlineInputBorder(),
              ),
            ),
          if (_action == WorkAction.checkIn ||
              _action == WorkAction.checkOut ||
              _action == WorkAction.logLocation) ...[
            const SizedBox(height: 12),
            const Text('Your current location will be included.'),
          ],
        ],
      ),
    );
  }
}
