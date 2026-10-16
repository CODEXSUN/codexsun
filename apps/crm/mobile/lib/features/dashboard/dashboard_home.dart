import 'dart:async';

import 'package:flutter/material.dart';

import '../../core/api/crm_mobile_api.dart';
import 'dashboard_list_page.dart';
import 'job_duration.dart';
import 'dashboard_jobs_feed.dart';
import 'job_detail_page.dart';

class DashboardHome extends StatelessWidget {
  const DashboardHome({
    required this.api,
    required this.session,
    required this.onOpenList,
    required this.onOpenActions,
    required this.jobsFeed,
    this.onReauthenticate,
    super.key,
  });

  final CrmMobileApi api;
  final UserSession session;
  final ValueChanged<int> onOpenList;
  final Future<void> Function() onOpenActions;
  final DashboardJobsFeed jobsFeed;
  final VoidCallback? onReauthenticate;

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
            _StatsRow(
              jobCount: jobs.length,
              onOpenList: onOpenList,
              api: api,
              session: session,
              onOpenActions: onOpenActions,
            ),
            if (runningJob != null) ...[
              const SizedBox(height: 18),
              _RunningJobCard(
                job: runningJob,
                onOpenJob: () => _openJob(context, runningJob),
              ),
            ],
          ],
        );
      },
    );
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
  const _RunningJobCard({required this.job, required this.onOpenJob});

  final CrmJob job;
  final VoidCallback onOpenJob;

  @override
  State<_RunningJobCard> createState() => _RunningJobCardState();
}

class _RunningJobCardState extends State<_RunningJobCard> {
  Timer? _timer;

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
        borderRadius: BorderRadius.circular(16),
        onTap: widget.onOpenJob,
        child: Ink(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(0xFFFCF9FD),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFD6B5E8)),
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
              Text(
                formatJobDuration(execution),
                style: theme.textTheme.titleSmall?.copyWith(
                  color: const Color(0xFF682A82),
                  fontWeight: FontWeight.w800,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _StatsRow extends StatelessWidget {
  const _StatsRow({
    required this.jobCount,
    required this.onOpenList,
    required this.api,
    required this.session,
    required this.onOpenActions,
  });

  final int jobCount;
  final ValueChanged<int> onOpenList;
  final CrmMobileApi api;
  final UserSession session;
  final Future<void> Function() onOpenActions;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: _StatCard(
            icon: Icons.assignment_outlined,
            label: 'Enquiries',
            value: '$jobCount',
            onTap: () => onOpenList(1),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _LiveStatCard(
            icon: Icons.calendar_month_outlined,
            label: 'Duty',
            count: () =>
                api.duties(session.accessToken).then((duties) => duties.length),
            onTap: () async => onOpenList(2),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _LiveStatCard(
            icon: Icons.bolt_outlined,
            label: 'Activities',
            count: () async {
              try {
                final count = await api.activitiesCount(session.accessToken);
                if (count > 0) return count;
                final enquiries = await api.enquiries(
                  accessToken: session.accessToken,
                  scope: 'all',
                );
                return enquiries.fold<int>(
                  0,
                  (sum, e) => sum + e.activities.length + e.jobs.length,
                );
              } catch (_) {
                return 0;
              }
            },
            onTap: onOpenActions,
          ),
        ),
      ],
    );
  }
}

class _LiveStatCard extends StatefulWidget {
  const _LiveStatCard({
    required this.icon,
    required this.label,
    required this.count,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final Future<int> Function() count;
  final Future<void> Function() onTap;

  @override
  State<_LiveStatCard> createState() => _LiveStatCardState();
}

class _LiveStatCardState extends State<_LiveStatCard> {
  late final Future<int> _count = widget.count();

  @override
  Widget build(BuildContext context) => FutureBuilder<int>(
    future: _count,
    builder: (context, snapshot) => _StatCard(
      icon: widget.icon,
      label: widget.label,
      value: snapshot.hasData ? '${snapshot.data}' : '—',
      onTap: () => widget.onTap(),
    ),
  );
}

class _StatCard extends StatelessWidget {
  const _StatCard({
    required this.icon,
    required this.label,
    required this.value,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final String value;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Semantics(
      button: true,
      label: 'Open $label list',
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onTap,
        child: Ink(
          height: 96,
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: theme.colorScheme.surfaceContainerLowest,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFE9E1EE)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(icon, size: 17, color: theme.colorScheme.primary),
              const Spacer(),
              Text(value, style: theme.textTheme.titleMedium),
              Text(label, style: theme.textTheme.labelMedium),
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
