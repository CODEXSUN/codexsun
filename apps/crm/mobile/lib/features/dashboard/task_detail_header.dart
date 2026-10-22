import 'package:flutter/material.dart';

import '../../core/api/crm_mobile_api.dart';

class TaskDetailHeader extends StatelessWidget {
  const TaskDetailHeader({
    required this.task,
    required this.runningJobStartedAt,
    required this.now,
    super.key,
  });

  final Map<String, dynamic> task;
  final DateTime? runningJobStartedAt;
  final DateTime now;

  @override
  Widget build(BuildContext context) {
    final title = normalizeCrmText('${task['title'] ?? 'Task'}');
    final contact = normalizeCrmText('${task['contactName'] ?? ''}');
    final phone = normalizeCrmText('${task['contactPhone'] ?? ''}');
    final status = normalizeCrmText(
      '${task['statusName'] ?? task['status'] ?? ''}',
    );
    final description = normalizeCrmText('${task['description'] ?? ''}');
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 16),
      color: const Color(0xFFFCF9FD),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              _TaskStatusBadge(status: status),
              const SizedBox(width: 8),
              if ('${task['listIn'] ?? ''}'.trim().isNotEmpty)
                Text(
                  normalizeCrmText('${task['listIn']}').toUpperCase(),
                  style: Theme.of(context).textTheme.labelMedium,
                ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            title,
            style: Theme.of(context).textTheme.titleMedium
                ?.copyWith(fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 10),
          Container(
            key: const ValueKey('task-detail-heading-divider'),
            height: 1,
            color: const Color(0xFFE2DCE5),
          ),
          if (runningJobStartedAt != null) ...[
            const SizedBox(height: 8),
            Align(
              alignment: Alignment.centerLeft,
              child: TaskRunningTimer(startedAt: runningJobStartedAt, now: now),
            ),
          ],
          if (contact.isNotEmpty || phone.isNotEmpty) ...[
            const SizedBox(height: 6),
            Text(
              [contact, phone].where((value) => value.isNotEmpty).join(' · '),
            ),
          ],
          if (description.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(description, maxLines: 4, overflow: TextOverflow.ellipsis),
          ],
        ],
      ),
    );
  }
}

class _TaskStatusBadge extends StatelessWidget {
  const _TaskStatusBadge({required this.status});
  final String status;

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
    decoration: BoxDecoration(
      color: const Color(0xFFE7F4FF),
      borderRadius: BorderRadius.circular(18),
    ),
    child: Text(
      status,
      style: const TextStyle(
        color: Color(0xFF126A9A),
        fontSize: 12,
        fontWeight: FontWeight.w700,
      ),
    ),
  );
}

class TaskRunningTimer extends StatelessWidget {
  const TaskRunningTimer({
    required this.startedAt,
    required this.now,
    super.key,
  });
  final DateTime? startedAt;
  final DateTime now;

  @override
  Widget build(BuildContext context) {
    final elapsed = startedAt == null
        ? Duration.zero
        : now.difference(startedAt!);
    final seconds = elapsed.inSeconds.clamp(0, 999999);
    final text =
        '${(seconds ~/ 3600).toString().padLeft(2, '0')}:'
        '${(seconds % 3600 ~/ 60).toString().padLeft(2, '0')}:'
        '${(seconds % 60).toString().padLeft(2, '0')}';
    return Chip(
      key: const ValueKey('task-detail-running-clock'),
      avatar: const Icon(Icons.timer_outlined, size: 16),
      label: Text(text),
      visualDensity: VisualDensity.compact,
    );
  }
}
