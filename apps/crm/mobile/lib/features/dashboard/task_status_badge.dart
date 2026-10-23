import 'package:flutter/material.dart';

class TaskStatusBadge extends StatelessWidget {
  const TaskStatusBadge({required this.status, this.number, super.key});
  final String status;
  final int? number;

  @override
  Widget build(BuildContext context) {
    final code = status.toLowerCase().replaceAll(RegExp(r'[ _]+'), '-');
    final color = switch (code) {
      'new' || 'reopen' => const Color(0xFF2563EB),
      'open' || 'contacted' => const Color(0xFF0EA5E9),
      'won' || 'completed' || 'qualified' => const Color(0xFF10B981),
      'lost' => const Color(0xFFDC2626),
      'long-hold' => const Color(0xFF7C3AED),
      'hold-for-approval' || 'hold-for-job-out' => const Color(0xFFF59E0B),
      'hold-for-spares' => const Color(0xFFF97316),
      'escalation' => const Color(0xFFE11D48),
      _ => const Color(0xFF475569),
    };
    final foreground =
        [
          'open',
          'contacted',
          'won',
          'completed',
          'qualified',
          'hold-for-approval',
          'hold-for-job-out',
          'hold-for-spares',
        ].contains(code)
        ? const Color(0xFF020617)
        : Colors.white;
    return Container(
      padding: const EdgeInsets.fromLTRB(7, 5, 9, 5),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(18),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.adjust_rounded, size: 15, color: foreground),
          const SizedBox(width: 4),
          Text(
            '${number == null ? '' : '#$number  '}$status',
            style: TextStyle(
              color: foreground,
              fontSize: 12,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}
