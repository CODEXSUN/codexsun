import 'dart:async';

import 'package:flutter/material.dart';

import '../../core/api/crm_mobile_api.dart';
import 'dashboard_list_page.dart';
import 'job_duration.dart';
import 'dashboard_jobs_feed.dart';
import 'job_detail_page.dart';
import 'dashboard_stats.dart';

class DashboardHome extends StatelessWidget {
  const DashboardHome({
    required this.api,
    required this.session,
    required this.onOpenList,
    required this.jobsFeed,
    this.onReauthenticate,
    this.assignmentCount = 0,
    super.key,
  });

  final CrmMobileApi api;
  final UserSession session;
  final ValueChanged<int> onOpenList;
  final DashboardJobsFeed jobsFeed;
  final VoidCallback? onReauthenticate;
  final int assignmentCount;

  @override
  Widget build(BuildContext context) {
    final greeting = _Greeting.forTime(DateTime.now());
    final firstName = session.profile.name.split(' ').first;
    return ListenableBuilder(
      listenable: jobsFeed,
      builder: (context, child) {
        if (jobsFeed.error != null && jobsFeed.jobs.isEmpty) {
          return Center(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.cloud_off_outlined, size: 32),
                  const SizedBox(height: 12),
                  Text(
                    'Could not load live dashboard data.',
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: 6),
                  Text(
                    jobsFeed.error!,
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                  const SizedBox(height: 16),
                  FilledButton.tonalIcon(
                    onPressed: jobsFeed.refresh,
                    icon: const Icon(Icons.refresh_rounded),
                    label: const Text('Retry'),
                  ),
                  if (jobsFeed.error!.contains(
                        'not valid for the requested domain',
                      ) &&
                      onReauthenticate != null) ...[
                    const SizedBox(height: 8),
                    TextButton.icon(
                      onPressed: onReauthenticate,
                      icon: const Icon(Icons.login_rounded),
                      label: const Text('Sign in again'),
                    ),
                  ],
                ],
              ),
            ),
          );
        }
        if (jobsFeed.isLoading && jobsFeed.jobs.isEmpty) {
          return const Center(child: CircularProgressIndicator());
        }
        final jobs = jobsFeed.jobs;
        final runningJob = _runningJob(jobs);
        return ListView(
          padding: const EdgeInsets.fromLTRB(20, 20, 20, 32),
          children: [
            Text(
              '${greeting.label}, $firstName',
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.titleLarge
                  ?.copyWith(fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 10),
            Text(
              greeting.quote,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: const Color(0xFF5F5967),
                fontStyle: FontStyle.italic,
                height: 1.35,
              ),
            ),
            const SizedBox(height: 24),
            DashboardStats(
              jobCount: jobs.length,
              assignmentCount: assignmentCount,
              onOpenList: onOpenList,
              api: api,
              session: session,
            ),
            if (runningJob != null) ...[
              const SizedBox(height: 18),
              _RunningJobCard(
                job: runningJob,
                onOpenJob: () => _openJob(context, runningJob),
                onStopJob: () => _stopRunningJob(context, runningJob),
              ),
            ],
          ],
        );
      },
    );
  }

  Future<void> _stopRunningJob(BuildContext context, CrmJob job) async {
    final execution = job.jobs
        .where((candidate) => candidate.isRunning)
        .firstOrNull;
    if (execution == null) return;
    try {
      final updated = await api.stopJob(
        accessToken: session.accessToken,
        id: job.sourceId,
        jobName: execution.name,
      );
      if (!context.mounted) return;
      jobsFeed.updateJob(updated);
      ScaffoldMessenger.of(context)
        ..hideCurrentSnackBar()
        ..showSnackBar(const SnackBar(content: Text('Job stopped.')));
    } on CrmMobileApiException catch (error) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context)
        ..hideCurrentSnackBar()
        ..showSnackBar(SnackBar(content: Text(error.message)));
    }
  }

  Future<void> _openJob(BuildContext context, CrmJob job) async {
    await Navigator.of(context).push<void>(
      MaterialPageRoute(
        builder: (context) => JobDetailPage(
          api: api,
          session: session,
          enquiry: DashboardListItem.fromCrmJob(job),
          initialJob: job,
          onJobChanged: jobsFeed.refresh,
          onJobUpdated: jobsFeed.updateJob,
        ),
      ),
    );
  }
}

CrmJob? _runningJob(List<CrmJob> jobs) {
  for (final job in jobs) {
    if (job.jobs.any((execution) => execution.isRunning)) return job;
  }
  return null;
}

class _RunningJobCard extends StatefulWidget {
  const _RunningJobCard({
    required this.job,
    required this.onOpenJob,
    required this.onStopJob,
  });

  final CrmJob job;
  final VoidCallback onOpenJob;
  final Future<void> Function() onStopJob;

  @override
  State<_RunningJobCard> createState() => _RunningJobCardState();
}

class _RunningJobCardState extends State<_RunningJobCard> {
  Timer? _timer;
  var _isStopping = false;

  @override
  void initState() {
    super.initState();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) setState(() {});
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  Future<void> _stopJob() async {
    if (_isStopping) return;
    setState(() => _isStopping = true);
    try {
      await widget.onStopJob();
    } finally {
      if (mounted) setState(() => _isStopping = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final execution = widget.job.jobs.firstWhere(
      (candidate) => candidate.isRunning,
    );
    final theme = Theme.of(context);
    return Semantics(
      button: true,
      label: 'Open running job ${widget.job.title}',
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: widget.onOpenJob,
        child: Ink(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: const Color(0xFFE1DCE6)),
            boxShadow: const [
              BoxShadow(
                color: Color(0x1A140D1B),
                blurRadius: 6,
                offset: Offset(0, 2),
              ),
            ],
          ),
          child: Row(
            children: [
              const CircleAvatar(
                backgroundColor: Color(0xFFF0E2FA),
                foregroundColor: Color(0xFF682A82),
                child: Icon(Icons.timer_outlined),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Job running',
                      style: theme.textTheme.labelMedium?.copyWith(
                        color: const Color(0xFF682A82),
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      widget.job.title,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: theme.textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    formatJobDuration(execution),
                    style: theme.textTheme.titleSmall?.copyWith(
                      color: const Color(0xFF682A82),
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 6),
                  FilledButton.tonalIcon(
                    onPressed: _isStopping ? null : _stopJob,
                    icon: _isStopping
                        ? const SizedBox.square(
                            dimension: 16,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Icon(Icons.stop_rounded, size: 16),
                    label: const Text('Stop Job'),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Greeting {
  const _Greeting(this.label, this.quote);

  final String label;
  final String quote;

  factory _Greeting.forTime(DateTime time) {
    final hour = time.hour;
    if (hour >= 5 && hour < 12) {
      return const _Greeting(
        'Good morning',
        'Small progress today builds meaningful results.',
      );
    }
    if (hour < 16) {
      return const _Greeting(
        'Good noon',
        'Stay focused: the next clear action moves work forward.',
      );
    }
    if (hour < 20) {
      return const _Greeting(
        'Good evening',
        'Finish the day with one useful step completed.',
      );
    }
    return const _Greeting(
      'Good night',
      'Review, recharge, and return ready for tomorrow.',
    );
  }
}
