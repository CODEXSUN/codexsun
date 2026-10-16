import 'dart:async';

import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';

import '../../core/api/crm_mobile_api.dart';
import '../../core/platform/mobile_actions.dart';
import 'dashboard_list_page.dart';
import 'job_add_action_sheet.dart';
import 'job_duration.dart';
import 'job_work_feed.dart';

const _detailSurfaceTone = Color(0xFFFCF9FD);

class JobDetailPage extends StatefulWidget {
  const JobDetailPage({
    required this.api,
    required this.session,
    required this.enquiry,
    required this.initialJob,
    this.capturePosition,
    this.onJobChanged,
    super.key,
  });

  final CrmMobileApi api;
  final UserSession session;
  final DashboardListItem enquiry;
  final CrmJob initialJob;
  final Future<Position> Function()? capturePosition;
  final VoidCallback? onJobChanged;

  @override
  State<JobDetailPage> createState() => _JobDetailPageState();
}

class _JobDetailPageState extends State<JobDetailPage> {
  final _replyController = TextEditingController();
  late CrmJob _job;
  ClosureRequest? _closureRequest;
  List<CrmEnquiryLocation> _locations = const [];
  var _isLoading = false;
  var _isSending = false;
  Timer? _runningTimer;

  @override
  void initState() {
    super.initState();
    _job = widget.initialJob;
    _syncRunningTimer();
    _refresh();
  }

  @override
  void dispose() {
    _runningTimer?.cancel();
    _replyController.dispose();
    super.dispose();
  }

  void _syncRunningTimer() {
    if (!_job.jobs.any((job) => job.isRunning)) {
      _runningTimer?.cancel();
      _runningTimer = null;
      return;
    }
    _runningTimer ??= Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) setState(() {});
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      resizeToAvoidBottomInset: false,
      floatingActionButton: FloatingActionButton(
        tooltip: 'Add action',
        onPressed: _isSending ? null : _openAddActions,
        child: const Icon(Icons.add),
      ),
      body: SafeArea(
        bottom: false,
        child: Column(
          children: [
            _CompactJobDetail(
              enquiry: DashboardListItem.fromCrmJob(_job),
              job: _job,
              onTapStatus: _isSending ? () {} : _showStatusPicker,
              onOpenNewCall: _isSending ? () {} : _openNewCall,
            ),
            if (_isLoading) const LinearProgressIndicator(minHeight: 2),
            if (_closureRequest?.status == 'pending')
              const MaterialBanner(
                content: Text('Completion sent. Waiting for web approval.'),
                leading: Icon(Icons.hourglass_top_rounded),
                actions: [SizedBox.shrink()],
              ),
            if (_closureRequest?.status == 'rejected')
              MaterialBanner(
                content: Text(
                  _closureRequest?.reviewNote?.trim().isNotEmpty == true
                      ? 'Closure request rejected: ${_closureRequest!.reviewNote}'
                      : 'Closure request was rejected. You can request again.',
                ),
                leading: const Icon(Icons.info_outline),
                actions: const [SizedBox.shrink()],
              ),
            Expanded(
              child: JobWorkFeed(
                job: _job,
                session: widget.session,
                locations: _locations,
              ),
            ),
          ],
        ),
      ),
      bottomNavigationBar: _ReplyComposer(
        controller: _replyController,
        onSend: _isSending ? null : _addComment,
      ),
    );
  }

  Future<void> _refresh() async {
    setState(() => _isLoading = true);
    try {
      final results = await Future.wait<Object?>([
        widget.api.job(widget.session.accessToken, widget.initialJob.sourceId),
        widget.api.latestClosureRequest(
          accessToken: widget.session.accessToken,
          id: widget.initialJob.sourceId,
        ),
        widget.api.enquiryLocations(
          accessToken: widget.session.accessToken,
          enquiryId: widget.initialJob.sourceId,
        ),
      ]);
      final job = results[0] as CrmJob;
      if (mounted) {
        setState(() {
          _job = job;
          _closureRequest = results[1] as ClosureRequest?;
          _locations = results[2] as List<CrmEnquiryLocation>;
        });
        _syncRunningTimer();
        widget.onJobChanged?.call();
      }
    } on CrmMobileApiException catch (error) {
      if (mounted) _showError(error.message);
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _openAddActions() async {
    final runningJob = _job.jobs.where((job) => job.isRunning).firstOrNull;
    final action = await showJobAddActions(
      context,
      isJobRunning: runningJob != null,
      closurePending: _closureRequest?.status == 'pending',
      closureApproved: _closureRequest?.status == 'approved',
      timerLabel: runningJob == null ? null : formatJobDuration(runningJob),
    );
    if (!mounted || action == null) return;
    switch (action) {
      case JobAddAction.startJob:
        await _startJob();
      case JobAddAction.stopJob:
        await _stopJob();
      case JobAddAction.takePhoto:
        await _runDeviceAction(MobileActions.photo, 'Camera');
      case JobAddAction.scanDocument:
        await _runDeviceAction(MobileActions.scanDocument, 'Document scanner');
      case JobAddAction.logLocation:
        await _captureLocation();
      case JobAddAction.markCompleted:
        await _requestClosure();
      case JobAddAction.charges:
        await _recordAmount('Charges');
      case JobAddAction.collected:
        await _recordAmount('Collected');
    }
  }

  Future<void> _addComment() async {
    final message = _replyController.text.trim();
    if (message.isEmpty) return;
    await _saveComment(message);
    _replyController.clear();
    if (mounted) FocusScope.of(context).unfocus();
  }

  Future<void> _recordAmount(String label) async {
    final amount = await _requestAmount(context, label);
    if (!mounted || amount == null) return;
    await _saveComment('$label: ₹$amount');
  }

  Future<void> _saveComment(String comment) async {
    setState(() => _isSending = true);
    try {
      final job = await widget.api.addJobComment(
        accessToken: widget.session.accessToken,
        id: widget.initialJob.sourceId,
        comment: comment,
      );
      if (mounted) {
        setState(() => _job = job);
        _syncRunningTimer();
        widget.onJobChanged?.call();
      }
    } on CrmMobileApiException catch (error) {
      if (mounted) _showError(error.message);
    } finally {
      if (mounted) setState(() => _isSending = false);
    }
  }

  Future<void> _startJob() async {
    await _runJobAction(
      () => widget.api.startJob(
        accessToken: widget.session.accessToken,
        id: widget.initialJob.sourceId,
      ),
    );
    _logActionLocation();
  }

  Future<void> _stopJob() async {
    final running = _job.jobs.where((job) => job.isRunning).firstOrNull;
    if (running == null) {
      _showError('No running job to mark completed.');
      return;
    }
    await _runJobAction(
      () => widget.api.stopJob(
        accessToken: widget.session.accessToken,
        id: widget.initialJob.sourceId,
        jobName: running.name,
      ),
    );
    _logActionLocation();
  }

  Future<void> _requestClosure() async {
    if (_closureRequest?.status == 'pending') {
      _showError('Completion is already waiting for approval.');
      return;
    }
    setState(() => _isSending = true);
    try {
      final closureRequest = await widget.api.requestClosure(
        accessToken: widget.session.accessToken,
        id: widget.initialJob.sourceId,
      );
      if (mounted) {
        setState(() => _closureRequest = closureRequest);
        _logActionLocation();
        await _refresh();
        if (!mounted) return;
        ScaffoldMessenger.of(context)
          ..hideCurrentSnackBar()
          ..showSnackBar(
            const SnackBar(content: Text('Completion sent for approval.')),
          );
      }
    } on CrmMobileApiException catch (error) {
      if (mounted) _showError(error.message);
    } finally {
      if (mounted) setState(() => _isSending = false);
    }
  }

  Future<void> _runDeviceAction(
    Future<bool> Function() action,
    String label,
  ) async {
    if (await action()) return;
    if (mounted) _showError('$label is not available on this device.');
  }

  Future<void> _captureLocation() async {
    setState(() => _isSending = true);
    try {
      final position =
          await (widget.capturePosition ?? _captureDevicePosition)();
      final results = await Future.wait([
        widget.api.logEnquiryLocation(
          accessToken: widget.session.accessToken,
          enquiryId: widget.initialJob.sourceId,
          latitude: position.latitude,
          longitude: position.longitude,
          accuracyMeters: position.accuracy.isFinite ? position.accuracy : null,
          capturedAt: position.timestamp,
        ),
        widget.api.addJobComment(
          accessToken: widget.session.accessToken,
          id: widget.initialJob.sourceId,
          comment: 'Location logged from mobile.',
        ),
      ]);
      final saved = results[0] as CrmEnquiryLocation;
      final updated = results[1] as CrmJob;
      if (mounted) {
        setState(() {
          _locations = [saved, ..._locations];
          _job = updated;
        });
        widget.onJobChanged?.call();
        ScaffoldMessenger.of(context)
          ..hideCurrentSnackBar()
          ..showSnackBar(
            const SnackBar(content: Text('Location saved to enquiry.')),
          );
      }
    } on CrmMobileApiException catch (error) {
      if (mounted) _showError(error.message);
    } on LocationServiceDisabledException {
      if (mounted) _showError('Turn on device location and try again.');
    } on PermissionDeniedException {
      if (mounted) {
        _showError('Allow location access to log this enquiry location.');
      }
    } catch (error) {
      if (mounted) _showError('Could not get location: $error');
    } finally {
      if (mounted) setState(() => _isSending = false);
    }
  }

  void _logActionLocation() {
    () async {
      try {
        final position =
            await (widget.capturePosition ?? _captureDevicePosition)();
        final saved = await widget.api.logEnquiryLocation(
          accessToken: widget.session.accessToken,
          enquiryId: widget.initialJob.sourceId,
          latitude: position.latitude,
          longitude: position.longitude,
          accuracyMeters: position.accuracy.isFinite ? position.accuracy : null,
          capturedAt: position.timestamp,
        );
        if (mounted) {
          setState(() => _locations = [saved, ..._locations]);
        }
      } catch (_) {
        // Non-blocking background location capture for CRM action
      }
    }();
  }

  Future<Position> _captureDevicePosition() async {
    if (!await Geolocator.isLocationServiceEnabled()) {
      throw const CrmMobileApiException(
        'Turn on device location and try again.',
      );
    }
    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }
    if (permission == LocationPermission.denied ||
        permission == LocationPermission.deniedForever) {
      throw const CrmMobileApiException(
        'Allow location access to log this enquiry location.',
      );
    }

    try {
      final lastKnown = await Geolocator.getLastKnownPosition();
      if (lastKnown != null) {
        final age = DateTime.now().difference(lastKnown.timestamp);
        if (age < const Duration(minutes: 5)) {
          return lastKnown;
        }
      }
    } catch (_) {}

    try {
      return await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.medium,
          timeLimit: Duration(seconds: 4),
        ),
      );
    } catch (_) {
      final fallback = await Geolocator.getLastKnownPosition();
      if (fallback != null) {
        return fallback;
      }
      rethrow;
    }
  }

  Future<void> _runJobAction(Future<CrmJob> Function() action) async {
    setState(() => _isSending = true);
    try {
      final job = await action();
      if (mounted) {
        setState(() => _job = job);
        _syncRunningTimer();
        widget.onJobChanged?.call();
      }
    } on CrmMobileApiException catch (error) {
      if (mounted) _showError(error.message);
    } finally {
      if (mounted) setState(() => _isSending = false);
    }
  }

  Future<void> _openNewCall() async {
    setState(() => _isSending = true);
    try {
      final updated = await widget.api.openNewCall(
        accessToken: widget.session.accessToken,
        id: widget.initialJob.sourceId,
      );
      if (mounted) {
        setState(() => _job = updated);
        _syncRunningTimer();
        widget.onJobChanged?.call();
        _logActionLocation();
        ScaffoldMessenger.of(context)
          ..hideCurrentSnackBar()
          ..showSnackBar(
            const SnackBar(content: Text('New call opened successfully.')),
          );
      }
    } on CrmMobileApiException catch (error) {
      if (mounted) _showError(error.message);
    } finally {
      if (mounted) setState(() => _isSending = false);
    }
  }

  Future<void> _showStatusPicker() async {
    try {
      final formData = await widget.api.callEnquiryFormData(
        widget.session.accessToken,
      );
      if (!mounted || formData.statuses.isEmpty) return;
      final chosenStatus = await showModalBottomSheet<CrmCallEnquiryStatus>(
        context: context,
        showDragHandle: true,
        builder: (context) => SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Padding(
                padding: EdgeInsets.fromLTRB(16, 8, 16, 12),
                child: Text(
                  'Change Status',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
              ),
              Flexible(
                child: ListView(
                  shrinkWrap: true,
                  children: formData.statuses.map((status) {
                    final isCurrent =
                        status.name.toLowerCase() == _job.status.toLowerCase();
                    return ListTile(
                      title: Text(status.name),
                      trailing: isCurrent
                          ? const Icon(Icons.check, color: Color(0xFF662C90))
                          : null,
                      onTap: () => Navigator.of(context).pop(status),
                    );
                  }).toList(),
                ),
              ),
            ],
          ),
        ),
      );
      if (!mounted || chosenStatus == null) return;
      if (chosenStatus.name.toLowerCase() == _job.status.toLowerCase()) return;

      String? closedReason;
      final code = chosenStatus.code.toLowerCase();
      if (code == 'won' || code == 'lost' || code == 'closed') {
        closedReason = await showDialog<String>(
          context: context,
          builder: (context) {
            final reasonController = TextEditingController();
            return AlertDialog(
              title: Text('Reason for ${chosenStatus.name}'),
              content: TextField(
                controller: reasonController,
                autofocus: true,
                decoration: const InputDecoration(
                  hintText: 'Enter outcome or closure reason...',
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(context).pop(),
                  child: const Text('Cancel'),
                ),
                FilledButton(
                  onPressed: () {
                    final text = reasonController.text.trim();
                    if (text.isNotEmpty) Navigator.of(context).pop(text);
                  },
                  child: const Text('Save'),
                ),
              ],
            );
          },
        );
        if (closedReason == null || closedReason.isEmpty) return;
      }

      setState(() => _isSending = true);
      try {
        final updated = await widget.api.updateProperties(
          accessToken: widget.session.accessToken,
          id: widget.initialJob.sourceId,
          statusId: chosenStatus.id,
          closedReason: closedReason,
        );
        if (mounted) {
          setState(() => _job = updated);
          _syncRunningTimer();
          widget.onJobChanged?.call();
          _logActionLocation();
          ScaffoldMessenger.of(context)
            ..hideCurrentSnackBar()
            ..showSnackBar(
              SnackBar(
                content: Text('Status updated to ${chosenStatus.name}.'),
              ),
            );
        }
      } on CrmMobileApiException catch (error) {
        if (mounted) _showError(error.message);
      } finally {
        if (mounted) setState(() => _isSending = false);
      }
    } on CrmMobileApiException catch (error) {
      if (mounted) _showError(error.message);
    }
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(content: Text(message)));
  }
}

class _CompactJobDetail extends StatelessWidget {
  const _CompactJobDetail({
    required this.enquiry,
    required this.job,
    required this.onTapStatus,
    required this.onOpenNewCall,
  });

  final DashboardListItem enquiry;
  final CrmJob job;
  final VoidCallback onTapStatus;
  final VoidCallback onOpenNewCall;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(16, 6, 16, 10),
      decoration: const BoxDecoration(
        color: _detailSurfaceTone,
        border: Border(bottom: BorderSide(color: Color(0xFFE7E1E9))),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              IconButton(
                tooltip: 'Back to jobs',
                visualDensity: VisualDensity.compact,
                onPressed: () => Navigator.of(context).pop(),
                icon: const Icon(Icons.arrow_back_rounded),
              ),
              _DetailStatusBadge(
                number: enquiry.enquiryNumber,
                status: enquiry.status,
                statusName: job.status.isNotEmpty ? job.status : null,
                onTap: onTapStatus,
              ),
              if (job.status.toLowerCase() == 'new') ...[
                const SizedBox(width: 8),
                FilledButton.tonalIcon(
                  style: FilledButton.styleFrom(
                    visualDensity: VisualDensity.compact,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 4,
                    ),
                  ),
                  onPressed: onOpenNewCall,
                  icon: const Icon(Icons.call_made, size: 14),
                  label: const Text(
                    'Open call',
                    style: TextStyle(fontSize: 11),
                  ),
                ),
              ],
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: const Color(0xFFEBE6F0),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  enquiry.list.toUpperCase(),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF5A5260),
                    letterSpacing: 0.5,
                  ),
                ),
              ),
              const Spacer(),
              _DetailJobTimer(job: job),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            enquiry.title,
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w800,
              color: const Color(0xFF1E1724),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Created by ${enquiry.createdBy} · ${enquiry.createdDate} | ${enquiry.createdAgo}',
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: const Color(0xFF6D6870),
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}

class _DetailStatusBadge extends StatelessWidget {
  const _DetailStatusBadge({
    required this.number,
    required this.status,
    this.statusName,
    this.onTap,
  });

  final String number;
  final JobStatus status;
  final String? statusName;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final rawLabel = statusName != null && statusName!.trim().isNotEmpty
        ? statusName!.trim()
        : _detailStatusLabel(status);
    final label = rawLabel.length > 1
        ? '${rawLabel[0].toUpperCase()}${rawLabel.substring(1)}'
        : rawLabel.toUpperCase();
    return InkWell(
      borderRadius: BorderRadius.circular(14),
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
        decoration: BoxDecoration(
          color: const Color(0xFF4F7FD4),
          borderRadius: BorderRadius.circular(14),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              Icons.radio_button_checked,
              size: 12,
              color: Colors.white,
            ),
            const SizedBox(width: 3),
            Text(
              '#$number  $label',
              style: const TextStyle(
                color: Colors.white,
                fontSize: 11,
                fontWeight: FontWeight.w800,
              ),
            ),
            if (onTap != null) ...[
              const SizedBox(width: 2),
              const Icon(Icons.arrow_drop_down, size: 14, color: Colors.white),
            ],
          ],
        ),
      ),
    );
  }
}

class _DetailJobTimer extends StatelessWidget {
  const _DetailJobTimer({required this.job});

  final CrmJob job;

  @override
  Widget build(BuildContext context) {
    final running = job.jobs.any((execution) => execution.isRunning);
    if (!running) return const SizedBox.shrink();
    final runningJob = job.jobs
        .where((execution) => execution.isRunning)
        .firstOrNull;
    final label = formatJobDuration(runningJob!);
    return DecoratedBox(
      decoration: BoxDecoration(
        color: const Color(0xFFF1DDF5),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              Icons.timer_outlined,
              size: 15,
              color: Color(0xFF682A82),
            ),
            const SizedBox(width: 4),
            Text(
              label,
              style: const TextStyle(
                color: Color(0xFF682A82),
                fontSize: 12,
                fontWeight: FontWeight.w800,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

String _detailStatusLabel(JobStatus status) => switch (status) {
  JobStatus.open => 'Open',
  JobStatus.won => 'Won',
  JobStatus.lost => 'Lost',
};

class _ReplyComposer extends StatelessWidget {
  const _ReplyComposer({required this.controller, required this.onSend});

  final TextEditingController controller;
  final VoidCallback? onSend;

  @override
  Widget build(BuildContext context) {
    final keyboardInset = MediaQuery.viewInsetsOf(context).bottom;
    return AnimatedPadding(
      duration: const Duration(milliseconds: 180),
      curve: Curves.easeOut,
      padding: EdgeInsets.only(
        bottom: keyboardInset == 0 ? 0 : keyboardInset + 8,
      ),
      child: SafeArea(
        top: false,
        bottom: keyboardInset == 0,
        child: DecoratedBox(
          decoration: const BoxDecoration(
            color: _detailSurfaceTone,
            border: Border(top: BorderSide(color: Color(0xFFF0ECF2))),
          ),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(14, 9, 14, 10),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: controller,
                    minLines: 1,
                    maxLines: 3,
                    textInputAction: TextInputAction.newline,
                    decoration: InputDecoration(
                      hintText: 'Write a comment only',
                      isDense: true,
                      filled: true,
                      fillColor: const Color(0xFFF9F7FA),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(16),
                        borderSide: BorderSide.none,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                IconButton.filled(
                  tooltip: 'Send reply',
                  onPressed: onSend,
                  icon: const Icon(Icons.send, size: 19),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

Future<String?> _requestAmount(BuildContext context, String label) async {
  final amount = await showDialog<String>(
    context: context,
    builder: (context) => _AmountDialog(label: label),
  );
  if (amount == null || double.tryParse(amount) == null) return null;
  return amount;
}

class _AmountDialog extends StatefulWidget {
  const _AmountDialog({required this.label});

  final String label;

  @override
  State<_AmountDialog> createState() => _AmountDialogState();
}

class _AmountDialogState extends State<_AmountDialog> {
  final _controller = TextEditingController();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => AlertDialog(
    title: Text('${widget.label} amount'),
    content: TextField(
      controller: _controller,
      autofocus: true,
      keyboardType: const TextInputType.numberWithOptions(decimal: true),
      decoration: const InputDecoration(prefixText: '₹ ', hintText: '0.00'),
    ),
    actions: [
      TextButton(
        onPressed: () => Navigator.of(context).pop(),
        child: const Text('Cancel'),
      ),
      FilledButton(
        onPressed: () => Navigator.of(context).pop(_controller.text.trim()),
        child: const Text('Save'),
      ),
    ],
  );
}
