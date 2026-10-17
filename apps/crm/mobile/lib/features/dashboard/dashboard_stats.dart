import 'dart:async';

import 'package:flutter/material.dart';

import '../../core/api/crm_mobile_api.dart';
import 'tasks_page.dart';
import 'admin_call_log_page.dart';
import '../../core/platform/mobile_actions.dart';

class DashboardStats extends StatefulWidget {
  const DashboardStats({
    required this.api,
    required this.session,
    required this.jobCount,
    required this.onOpenList,
    required this.onOpenActions,
    this.unreadChatCount = 0,
    this.assignmentCount = 0,
    super.key,
  });
  final CrmMobileApi api;
  final UserSession session;
  final int jobCount;
  final int unreadChatCount;
  final int assignmentCount;
  final ValueChanged<int> onOpenList;
  final Future<void> Function() onOpenActions;
  @override
  State<DashboardStats> createState() => _DashboardStatsState();
}

class _DashboardStatsState extends State<DashboardStats> {
  final Map<String, int> _counts = {};
  final Set<String> _errors = {};
  Timer? _timer;
  bool _loading = false;
  @override
  void initState() {
    super.initState();
    _refresh();
    _timer = Timer.periodic(const Duration(seconds: 20), (_) => _refresh());
  }

  @override
  void didUpdateWidget(covariant DashboardStats oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.session.accessToken != widget.session.accessToken) {
      _counts.clear();
      _refresh();
    }
  }

  Future<void> _refresh() async {
    if (_loading) return;
    _loading = true;
    final token = widget.session.accessToken;
    await Future.wait([
      if (isCallLogAdministrator(widget.session.profile.role))
        _load('Call logs', () async {
          if (!await MobileActions.hasCallLogAccess())
            throw StateError('Permission required');
          return (await MobileActions.callLogs()).length;
        }, token),
      _load('Tasks', () => widget.api.tasksCount(token), token),
      _load('Duty', () async => (await widget.api.duties(token)).length, token),
      _load('Activities', () => widget.api.activitiesCount(token), token),
      _load(
        'Chat',
        () async => (await widget.api.conversations(
          accessToken: token,
          currentEmail: widget.session.profile.email,
        )).length,
        token,
      ),
    ]);
    _loading = false;
  }

  Future<void> _load(
    String label,
    Future<int> Function() request,
    String token,
  ) async {
    try {
      final value = await request();
      if (!mounted || token != widget.session.accessToken) return;
      setState(() {
        _counts[label] = value;
        _errors.remove(label);
      });
    } catch (_) {
      if (mounted && token == widget.session.accessToken)
        setState(() => _errors.add(label));
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  Widget _card(
    String label,
    IconData icon,
    VoidCallback open, {
    int? count,
    int badge = 0,
  }) => _StatCard(
    icon: icon,
    label: label,
    value: count != null
        ? '$count'
        : _counts.containsKey(label)
        ? '${_counts[label]}'
        : _errors.contains(label)
        ? 'Unavailable'
        : '…',
    onTap: open,
    badgeCount: badge,
  );
  @override
  Widget build(BuildContext context) => LayoutBuilder(
    builder: (context, constraints) {
      final width = (constraints.maxWidth - 24) / 3;
      return Wrap(
        spacing: 12,
        runSpacing: 12,
        children: [
          _card(
            'Enquiries',
            Icons.assignment_outlined,
            () => widget.onOpenList(1),
            count: widget.jobCount,
            badge: widget.assignmentCount,
          ),
          _card('Tasks', Icons.task_alt, () async {
            await Navigator.of(context).push<void>(
              MaterialPageRoute(
                builder: (_) =>
                    TasksPage(api: widget.api, session: widget.session),
              ),
            );
            _refresh();
          }),
          _card(
            'Duty',
            Icons.calendar_month_outlined,
            () => widget.onOpenList(2),
          ),
          _card('Activities', Icons.bolt_outlined, widget.onOpenActions),
          _card(
            'Chat',
            Icons.chat_bubble_outline,
            () => widget.onOpenList(3),
            badge: widget.unreadChatCount,
          ),
          if (isCallLogAdministrator(widget.session.profile.role))
            _card('Call logs', Icons.call_outlined, () async {
              await Navigator.of(context).push<void>(
                MaterialPageRoute(
                  builder: (_) => AdminCallLogPage(
                    api: widget.api,
                    session: widget.session,
                  ),
                ),
              );
              _refresh();
            }),
        ].map((card) => SizedBox(width: width, child: card)).toList(),
      );
    },
  );
}

class _StatCard extends StatelessWidget {
  const _StatCard({
    required this.icon,
    required this.label,
    required this.value,
    required this.onTap,
    this.badgeCount = 0,
  });

  final IconData icon;
  final String label;
  final String value;
  final VoidCallback onTap;
  final int badgeCount;

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
              Row(
                children: [
                  Icon(icon, size: 17, color: theme.colorScheme.primary),
                  const Spacer(),
                  if (badgeCount > 0) Badge.count(count: badgeCount),
                ],
              ),
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
