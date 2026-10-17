import 'package:flutter/material.dart';

import '../../core/api/crm_mobile_api.dart';
import 'action_form_drawer.dart';

Future<bool> showDutyActionSheet({
  required BuildContext context,
  required CrmMobileApi api,
  required UserSession session,
  required CrmDuty duty,
  CrmDutyReport? report,
}) async =>
    await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      isDismissible: false,
      enableDrag: false,
      useSafeArea: true,
      constraints: const BoxConstraints(maxWidth: 560),
      builder: (_) => _DutyActionSheet(
        api: api,
        session: session,
        duty: duty,
        report: report,
      ),
    ) ??
    false;

class _DutyActionSheet extends StatefulWidget {
  const _DutyActionSheet({
    required this.api,
    required this.session,
    required this.duty,
    this.report,
  });
  final CrmMobileApi api;
  final UserSession session;
  final CrmDuty duty;
  final CrmDutyReport? report;
  @override
  State<_DutyActionSheet> createState() => _DutyActionSheetState();
}

class _DutyActionSheetState extends State<_DutyActionSheet> {
  late final TextEditingController _actions;
  final _issue = TextEditingController();
  String _result = 'completed';
  bool _busy = false;
  String? _error;
  @override
  void initState() {
    super.initState();
    _actions = TextEditingController(text: widget.report?.actions ?? '');
  }

  @override
  void dispose() {
    _actions.dispose();
    _issue.dispose();
    super.dispose();
  }

  Future<void> _confirm() async {
    if (_actions.text.trim().isEmpty ||
        (widget.report == null &&
            _result == 'blocked' &&
            _issue.text.trim().isEmpty)) {
      setState(() => _error = 'Enter actions and any required issue details.');
      return;
    }
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      final report = widget.report;
      if (report != null) {
        await widget.api.editDutyReport(
          accessToken: widget.session.accessToken,
          id: int.parse(report.name),
          date: report.date,
          actions: _actions.text.trim(),
        );
      } else {
        await widget.api.reportDuty(
          accessToken: widget.session.accessToken,
          assignmentId: widget.duty.assignmentId,
          actions: _actions.text.trim(),
          result: _result,
          issueDetails: _issue.text.trim(),
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
  Widget build(BuildContext context) => ActionFormDrawer(
    action: widget.report == null ? 'report' : 'edit',
    actions: [
      DropdownMenuItem(
        value: widget.report == null ? 'report' : 'edit',
        child: Text(widget.report == null ? 'Report duty' : 'Edit duty report'),
      ),
    ],
    onActionChanged: (_) {},
    busy: _busy,
    error: _error,
    onConfirm: _confirm,
    form: Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          widget.duty.sopName,
          style: Theme.of(context).textTheme.titleSmall,
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _actions,
          enabled: !_busy,
          minLines: 3,
          maxLines: 5,
          decoration: const InputDecoration(
            labelText: 'Actions taken',
            border: OutlineInputBorder(),
          ),
        ),
        if (widget.report == null) ...[
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            initialValue: _result,
            decoration: const InputDecoration(
              labelText: 'Result',
              border: OutlineInputBorder(),
            ),
            items: const [
              DropdownMenuItem(value: 'completed', child: Text('Completed')),
              DropdownMenuItem(value: 'blocked', child: Text('Blocked')),
            ],
            onChanged: _busy
                ? null
                : (value) => setState(() => _result = value ?? 'completed'),
          ),
        ],
        if (widget.report == null && _result == 'blocked') ...[
          const SizedBox(height: 12),
          TextField(
            controller: _issue,
            enabled: !_busy,
            maxLines: 3,
            decoration: const InputDecoration(
              labelText: 'Issue details',
              border: OutlineInputBorder(),
            ),
          ),
        ],
      ],
    ),
  );
}
