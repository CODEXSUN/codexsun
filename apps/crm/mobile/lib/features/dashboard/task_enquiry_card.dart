import 'dart:async';

import 'package:flutter/material.dart';

import '../../core/api/crm_mobile_api.dart';

class TaskEnquiryCard extends StatelessWidget {
  const TaskEnquiryCard({
    required this.task,
    required this.onOpen,
    required this.onActions,
    this.runningJobStartedAt,
    super.key,
  });

  final Map<String, dynamic> task;
  final VoidCallback onOpen;
  final VoidCallback onActions;
  final String? runningJobStartedAt;

  @override
  Widget build(BuildContext context) {
    final id = task['id'] as int? ?? 0;
    final pending = task['closurePending'] == true;
    final status = normalizeCrmText(
      '${task['statusName'] ?? task['status'] ?? ''}',
    );
    final title = normalizeCrmText('${task['title'] ?? ''}');
    final contact = normalizeCrmText('${task['contactName'] ?? ''}');
    final group = normalizeCrmText('${task['listIn'] ?? ''}');
    final dueDate = task['dueDate']?.toString() ?? '';
    final runningStart = DateTime.tryParse(runningJobStartedAt ?? '')
        ?.toLocal();
    final createdBy = normalizeCrmText(
      '${task['creatorName'] ?? task['createdBy'] ?? ''}',
    );
    final accent = pending ? const Color(0xFFF59E0B) : const Color(0xFF1596D2);

    return Card(
      margin: EdgeInsets.zero,
      elevation: 2,
      color: pending ? const Color(0xFFFFF7ED) : Colors.white,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(13),
        side: BorderSide(color: pending ? accent : const Color(0xFFE4DDE8)),
      ),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onOpen,
        child: Container(
          decoration: BoxDecoration(
            border: Border(left: BorderSide(color: accent, width: 4)),
          ),
          padding: const EdgeInsets.fromLTRB(12, 10, 12, 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 5,
                    ),
                    decoration: BoxDecoration(
                      color: pending
                          ? const Color(0xFFFFE8C2)
                          : const Color(0xFFEAF4FF),
                      borderRadius: BorderRadius.circular(18),
                    ),
                    child: Text(
                      '#$id  ${pending ? 'Mark Completed' : status}',
                      style: TextStyle(
                        color: pending
                            ? const Color(0xFF92400E)
                            : const Color(0xFF126A9A),
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                  if (group.isNotEmpty) ...[
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        group.toUpperCase(),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: Theme.of(context).textTheme.labelMedium,
                      ),
                    ),
                  ] else
                    const Spacer(),
                  if (runningStart != null) ...[
                    _TaskCardRunningTimer(startedAt: runningStart),
                    const SizedBox(width: 2),
                  ],
                  IconButton(
                    key: ValueKey('task-card-actions-$id'),
                    tooltip: 'Task actions',
                    visualDensity: VisualDensity.compact,
                    constraints: const BoxConstraints.tightFor(
                      width: 36,
                      height: 36,
                    ),
                    padding: EdgeInsets.zero,
                    onPressed: onActions,
                    icon: const Icon(
                      Icons.add_circle_rounded,
                      size: 30,
                      color: Color(0xFF682A82),
                    ),
                  ),
                ],
              ),
              if (contact.isNotEmpty) ...[
                const SizedBox(height: 5),
                Text(
                  contact,
                  style: Theme.of(context).textTheme.bodySmall
                      ?.copyWith(color: const Color(0xFF77717A)),
                ),
              ],
              const SizedBox(height: 3),
              Text(
                title.isEmpty ? 'Task' : title,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: Theme.of(context).textTheme.titleSmall
                    ?.copyWith(fontWeight: FontWeight.w800, height: 1.2),
              ),
              const SizedBox(height: 18),
              Row(
                children: [
                  Expanded(
                    child: Text(
                      [
                        if (createdBy.isNotEmpty) 'Created by $createdBy',
                        if (dueDate.isNotEmpty) 'Due $dueDate',
                      ].join(' · '),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: const Color(0xFF6D6870),
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                  const Icon(Icons.chevron_right_rounded, size: 18),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _TaskCardRunningTimer extends StatefulWidget {
  const _TaskCardRunningTimer({required this.startedAt});

  final DateTime startedAt;

  @override
  State<_TaskCardRunningTimer> createState() => _TaskCardRunningTimerState();
}

class _TaskCardRunningTimerState extends State<_TaskCardRunningTimer> {
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
    final elapsed = DateTime.now().difference(widget.startedAt).inSeconds;
    final seconds = elapsed.clamp(0, 999999);
    final clock = seconds < 3600
        ? '${(seconds ~/ 60).toString().padLeft(2, '0')}:'
              '${(seconds % 60).toString().padLeft(2, '0')}'
        : '${seconds ~/ 3600}:'
              '${(seconds % 3600 ~/ 60).toString().padLeft(2, '0')}:'
              '${(seconds % 60).toString().padLeft(2, '0')}';
    return Container(
      key: const ValueKey('task-card-running-clock'),
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 5),
      decoration: BoxDecoration(
        color: const Color(0xFF682A82),
        borderRadius: BorderRadius.circular(18),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.timer_outlined, size: 13, color: Colors.white),
          const SizedBox(width: 3),
          Text(
            clock,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 11,
              fontWeight: FontWeight.w800,
            ),
          ),
        ],
      ),
    );
  }
}
