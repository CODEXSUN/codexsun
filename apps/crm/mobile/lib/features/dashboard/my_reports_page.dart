import 'package:flutter/material.dart';

import '../../core/api/crm_mobile_api.dart';

class MyReportsPage extends StatefulWidget {
  const MyReportsPage({required this.api, required this.session, super.key});

  final CrmMobileApi api;
  final UserSession session;

  @override
  State<MyReportsPage> createState() => _MyReportsPageState();
}

class _MyReportsPageState extends State<MyReportsPage> {
  late Future<List<_DutyReportEntry>> _reports = _load();

  Future<List<_DutyReportEntry>> _load() async {
    final duties = await widget.api.duties(widget.session.accessToken);
    final reports =
        [
          for (final duty in duties)
            for (final report in duty.reports)
              _DutyReportEntry(
                title: duty.sopName,
                department: duty.department,
                report: report,
              ),
        ]..sort(
          (left, right) =>
              right.report.createdAt.compareTo(left.report.createdAt),
        );
    return reports;
  }

  Future<void> _refresh() async {
    final reports = _load();
    setState(() => _reports = reports);
    try {
      await reports;
    } catch (_) {
      // FutureBuilder renders the retry state for the failed request.
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(
      title: const Text('Reports'),
      actions: [
        IconButton(
          tooltip: 'Refresh reports',
          onPressed: _refresh,
          icon: const Icon(Icons.refresh_rounded),
        ),
      ],
    ),
    body: FutureBuilder<List<_DutyReportEntry>>(
      future: _reports,
      builder: (context, snapshot) {
        if (snapshot.hasError) {
          return Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text('Could not load your duty reports.'),
                TextButton(onPressed: _refresh, child: const Text('Retry')),
              ],
            ),
          );
        }
        if (!snapshot.hasData) {
          return const Center(child: CircularProgressIndicator());
        }
        final reports = snapshot.data!;
        if (reports.isEmpty) {
          return const Center(
            child: Text('No reports have been submitted yet.'),
          );
        }
        return RefreshIndicator(
          onRefresh: _refresh,
          child: ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: reports.length,
            separatorBuilder: (context, index) => const SizedBox(height: 10),
            itemBuilder: (context, index) => _ReportCard(entry: reports[index]),
          ),
        );
      },
    ),
  );
}

class _DutyReportEntry {
  const _DutyReportEntry({
    required this.title,
    required this.department,
    required this.report,
  });

  final String title;
  final String department;
  final CrmDutyReport report;
}

class _ReportCard extends StatelessWidget {
  const _ReportCard({required this.entry});

  final _DutyReportEntry entry;

  @override
  Widget build(BuildContext context) => Card(
    elevation: 0,
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(14),
      side: const BorderSide(color: Color(0xFFE7DFEB)),
    ),
    child: Padding(
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.description_outlined, color: Color(0xFF662C90)),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  entry.title.isEmpty ? 'Duty report' : entry.title,
                  style: Theme.of(context).textTheme.titleSmall
                      ?.copyWith(fontWeight: FontWeight.w700),
                ),
              ),
              Text(
                _dateLabel(entry.report.date),
                style: Theme.of(context).textTheme.labelSmall,
              ),
            ],
          ),
          if (entry.department.isNotEmpty) ...[
            const SizedBox(height: 4),
            Text(
              entry.department,
              style: Theme.of(context).textTheme.bodySmall,
            ),
          ],
          if (entry.report.actions.isNotEmpty) ...[
            const SizedBox(height: 10),
            Text(entry.report.actions),
          ],
        ],
      ),
    ),
  );
}

String _dateLabel(String value) {
  final date = DateTime.tryParse(value);
  if (date == null) return value;
  return '${date.day.toString().padLeft(2, '0')}-${date.month.toString().padLeft(2, '0')}-${date.year}';
}
