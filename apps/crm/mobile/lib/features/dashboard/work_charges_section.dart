import 'package:flutter/material.dart';

import '../../core/api/crm_mobile_api.dart';
import 'work_collection_dialog.dart';
import 'work_timestamp_format.dart';

class WorkChargesSection extends StatefulWidget {
  const WorkChargesSection({
    required this.api,
    required this.session,
    this.enquiryId,
    this.taskId,
    super.key,
  });

  final CrmMobileApi api;
  final UserSession session;
  final int? enquiryId;
  final int? taskId;

  @override
  State<WorkChargesSection> createState() => _WorkChargesSectionState();
}

class _WorkChargesSectionState extends State<WorkChargesSection> {
  final _rows = <Map<String, dynamic>>[];
  int _page = 0;
  int _total = 0;
  double _charged = 0;
  double _collected = 0;
  bool _loading = false;
  String? _error;

  double get _outstanding => (_charged - _collected).clamp(0, double.infinity);

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load({bool refresh = false}) async {
    if (_loading) return;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final nextPage = refresh ? 1 : _page + 1;
      final result = await widget.api.workCharges(
        widget.session.accessToken,
        enquiryId: widget.enquiryId,
        taskId: widget.taskId,
        page: nextPage,
      );
      if (!mounted) return;
      final amounts = result['amounts'] as Map<String, dynamic>? ?? {};
      setState(() {
        if (refresh) _rows.clear();
        _rows.addAll((result['items'] as List).cast<Map<String, dynamic>>());
        _page = nextPage;
        _total = (result['total'] as num).toInt();
        _charged = _amount(amounts['charges']);
        _collected = _amount(amounts['collections']);
      });
    } on CrmMobileApiException catch (error) {
      if (mounted) setState(() => _error = error.message);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _collect(Map<String, dynamic> charge) async {
    final saved = await showDialog<bool>(
      context: context,
      builder: (context) => WorkCollectionDialog(
        api: widget.api,
        session: widget.session,
        enquiryId: widget.enquiryId,
        taskId: widget.taskId,
        charge: charge,
        outstanding: _outstanding,
      ),
    );
    if (saved == true && mounted) await _load(refresh: true);
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: () => _load(refresh: true),
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 96),
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  'Charges',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
              ),
              IconButton(
                tooltip: 'Refresh charges',
                onPressed: _loading ? null : () => _load(refresh: true),
                icon: const Icon(Icons.refresh_rounded),
              ),
            ],
          ),
          Text(
            'Initiated ₹${_charged.toStringAsFixed(2)}  ·  Collected ₹${_collected.toStringAsFixed(2)}',
          ),
          Text('Outstanding ₹${_outstanding.toStringAsFixed(2)}'),
          if (_outstanding > 0) ...[
            const SizedBox(height: 10),
            Align(
              alignment: Alignment.centerLeft,
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 5,
                ),
                decoration: BoxDecoration(
                  color: const Color(0xFFF3E8FA),
                  border: Border.all(color: const Color(0xFFB785C9)),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      Icons.notifications_active_outlined,
                      size: 16,
                      color: Color(0xFF682A82),
                    ),
                    SizedBox(width: 6),
                    Text(
                      'Collection pending',
                      style: TextStyle(
                        color: Color(0xFF682A82),
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
          if (_error != null) ...[
            const SizedBox(height: 12),
            Text(
              _error!,
              style: TextStyle(color: Theme.of(context).colorScheme.error),
            ),
            TextButton(
              onPressed: () => _load(refresh: _page > 0),
              child: const Text('Retry'),
            ),
          ],
          if (_loading && _rows.isEmpty)
            const Center(child: CircularProgressIndicator()),
          if (!_loading && _rows.isEmpty && _error == null)
            const Padding(
              padding: EdgeInsets.only(top: 32),
              child: Center(child: Text('No charges have been recorded.')),
            ),
          for (final row in _rows)
            Card(
              child: ListTile(
                key: ValueKey('charge-row-${row['uuid']}'),
                leading: Icon(
                  row['action'] == 'charge'
                      ? Icons.receipt_long_outlined
                      : Icons.payments_outlined,
                ),
                title: Text(
                  '${row['action'] == 'charge' ? 'Charge initiated' : 'Collected'} · ₹${_amount(row['amount']).toStringAsFixed(2)}',
                ),
                subtitle: Text(
                  [
                    if ('${row['body'] ?? ''}'.trim().isNotEmpty)
                      '${row['body']}',
                    formatWorkTimestamps(
                      '${row['created_by_name'] ?? row['created_by'] ?? ''} · ${row['created_at'] ?? ''}',
                    ),
                  ].join('\n'),
                ),
                isThreeLine: '${row['body'] ?? ''}'.trim().isNotEmpty,
                trailing: row['action'] == 'charge' && _outstanding > 0
                    ? FilledButton.tonal(
                        onPressed: () => _collect(row),
                        style: FilledButton.styleFrom(
                          foregroundColor: const Color(0xFF682A82),
                          backgroundColor: const Color(0xFFF3E8FA),
                        ),
                        child: const Text('Collect'),
                      )
                    : null,
                onTap: row['action'] == 'charge' && _outstanding > 0
                    ? () => _collect(row)
                    : null,
              ),
            ),
          if (_rows.length < _total)
            TextButton(
              onPressed: _loading ? null : _load,
              child: Text(_loading ? 'Loading…' : 'Load more'),
            ),
        ],
      ),
    );
  }
}

double _amount(Object? value) =>
    value is num ? value.toDouble() : double.tryParse('$value') ?? 0;
