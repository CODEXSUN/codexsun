import 'package:flutter/material.dart';

import '../../core/api/crm_mobile_api.dart';
import 'duty_report_history.dart';

class DutyPage extends StatefulWidget {
  const DutyPage({required this.api, required this.session, super.key});

  final CrmMobileApi api;
  final UserSession session;

  @override
  State<DutyPage> createState() => _DutyPageState();
}

class _DutyPageState extends State<DutyPage> {
  late Future<List<CrmDuty>> _duties;

  @override
  void initState() {
    super.initState();
    _duties = _load();
  }

  Future<List<CrmDuty>> _load() => widget.api.duties(widget.session.accessToken);

  void _refresh() => setState(() => _duties = _load());

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<CrmDuty>>(
      future: _duties,
      builder: (context, snapshot) {
        if (snapshot.connectionState != ConnectionState.done) {
          return const Center(child: CircularProgressIndicator());
        }
        if (snapshot.hasError) {
          return _DutyState(
            icon: Icons.cloud_off_outlined,
            message: 'Could not load your live duties.',
            action: TextButton.icon(
              onPressed: _refresh,
              icon: const Icon(Icons.refresh_rounded),
              label: const Text('Retry'),
            ),
          );
        }
        final duties = snapshot.data ?? const <CrmDuty>[];
        if (duties.isEmpty) {
          return const _DutyState(
            icon: Icons.assignment_turned_in_outlined,
            message: 'No SOP duties are assigned to your employee record.',
          );
        }
        return RefreshIndicator(
          onRefresh: () async => _refresh(),
          child: ListView.separated(
            padding: const EdgeInsets.fromLTRB(16, 20, 16, 32),
            itemCount: duties.length,
            separatorBuilder: (_, _) => const SizedBox(height: 12),
            itemBuilder: (context, index) => _DutyCard(
              duty: duties[index],
              onReport: () => _report(duties[index]),
            ),
          ),
        );
      },
    );
  }

  Future<void> _report(CrmDuty duty) async {
    final submission = await showModalBottomSheet<_DutyReportInput>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (context) => _DutyReportSheet(duty: duty),
    );
    if (submission == null || !mounted) return;
    try {
      await widget.api.reportDuty(
        accessToken: widget.session.accessToken,
        assignmentId: duty.assignmentId,
        actions: submission.actions,
        result: submission.result,
        issueDetails: submission.issueDetails,
      );
      _refresh();
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(const SnackBar(content: Text('Duty report posted.')));
      }
    } on CrmMobileApiException catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(error.message)));
      }
    }
  }
}

class _DutyCard extends StatelessWidget {
  const _DutyCard({required this.duty, required this.onReport});

  final CrmDuty duty;
  final VoidCallback onReport;

  @override
  Widget build(BuildContext context) {
    final latest = duty.reports.isEmpty ? null : duty.reports.first;
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: const BorderSide(color: Color(0xFFE7DFEB)),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    duty.sopName,
                    style: Theme.of(context).textTheme.titleMedium
                        ?.copyWith(fontWeight: FontWeight.w700),
                  ),
                ),
                _FrequencyBadge(label: duty.frequency),
              ],
            ),
            if (duty.department.isNotEmpty) ...[
              const SizedBox(height: 4),
              Text(
                duty.department,
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ],
            if (duty.steps.isNotEmpty) ...[
              const SizedBox(height: 12),
              Text(duty.steps, maxLines: 4, overflow: TextOverflow.ellipsis),
            ],
            const SizedBox(height: 12),
            if (latest != null)
              Text(
                'Latest report · ${latest.date}\n${latest.actions}',
                maxLines: 3,
                overflow: TextOverflow.ellipsis,
                style: Theme.of(context).textTheme.bodySmall,
              )
            else
              Text(
                'No report posted yet.',
                style: Theme.of(context).textTheme.bodySmall,
              ),
            const SizedBox(height: 12),
            Align(
              alignment: Alignment.centerRight,
              child: FilledButton.icon(
                onPressed: onReport,
                icon: const Icon(Icons.add_task_outlined),
                label: const Text('Report duty'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _FrequencyBadge extends StatelessWidget {
  const _FrequencyBadge({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) => DecoratedBox(
    decoration: BoxDecoration(
      borderRadius: BorderRadius.circular(20),
      color: const Color(0xFFF2E5FA),
    ),
    child: Padding(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      child: Text(label, style: Theme.of(context).textTheme.labelMedium),
    ),
  );
}

class _DutyReportSheet extends StatefulWidget {
  const _DutyReportSheet({required this.duty});

  final CrmDuty duty;

  @override
  State<_DutyReportSheet> createState() => _DutyReportSheetState();
}

class _DutyReportSheetState extends State<_DutyReportSheet> {
  final _controller = TextEditingController();
  final _issueController = TextEditingController();
  String _result = 'completed';

  @override
  void dispose() {
    _controller.dispose();
    _issueController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => SingleChildScrollView(
    padding: EdgeInsets.fromLTRB(
      20,
      4,
      20,
      MediaQuery.viewInsetsOf(context).bottom + 24,
    ),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          widget.duty.sopName,
          style: Theme.of(context).textTheme.titleMedium,
        ),
        if (widget.duty.reports.isNotEmpty) ...[
          const SizedBox(height: 16),
          DutyReportHistory(reports: widget.duty.reports),
        ],
        const SizedBox(height: 12),
        TextField(
          controller: _controller,
          autofocus: true,
          minLines: 4,
          maxLines: 8,
          textCapitalization: TextCapitalization.sentences,
          decoration: const InputDecoration(
            alignLabelWithHint: true,
            border: OutlineInputBorder(),
            hintText: 'What did you complete?',
            labelText: 'Duty report',
          ),
        ),
        const SizedBox(height: 12),
        DropdownButtonFormField<String>(
          initialValue: _result,
          decoration: const InputDecoration(labelText: 'Result', border: OutlineInputBorder()),
          items: const [
            DropdownMenuItem(value: 'completed', child: Text('Completed')),
            DropdownMenuItem(value: 'blocked', child: Text('Blocked')),
          ],
          onChanged: (value) => setState(() => _result = value ?? 'completed'),
        ),
        if (_result == 'blocked') ...[
          const SizedBox(height: 12),
          TextField(
            controller: _issueController,
            minLines: 2,
            maxLines: 4,
            decoration: const InputDecoration(
              alignLabelWithHint: true,
              border: OutlineInputBorder(),
              labelText: 'Issue details',
            ),
          ),
        ],
        const SizedBox(height: 12),
        FilledButton(
          onPressed: () {
            final action = _controller.text.trim();
            final issue = _issueController.text.trim();
            if (action.isNotEmpty && (_result != 'blocked' || issue.isNotEmpty)) {
              Navigator.pop(context, _DutyReportInput(actions: action, result: _result, issueDetails: issue));
            }
          },
          child: const Text('Post report'),
        ),
      ],
    ),
  );
}

class _DutyReportInput {
  const _DutyReportInput({required this.actions, required this.result, required this.issueDetails});
  final String actions;
  final String result;
  final String issueDetails;
}

class _DutyState extends StatelessWidget {
  const _DutyState({required this.icon, required this.message, this.action});

  final IconData icon;
  final String message;
  final Widget? action;

  @override
  Widget build(BuildContext context) => Center(
    child: Padding(
      padding: const EdgeInsets.all(32),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 36, color: const Color(0xFF662C90)),
          const SizedBox(height: 12),
          Text(message, textAlign: TextAlign.center),
          ?action,
        ],
      ),
    ),
  );
}
