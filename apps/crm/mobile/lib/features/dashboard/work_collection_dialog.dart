import 'dart:math';

import 'package:flutter/material.dart';

import '../../core/api/crm_mobile_api.dart';

class WorkCollectionDialog extends StatefulWidget {
  const WorkCollectionDialog({
    required this.api,
    required this.session,
    required this.outstanding,
    this.charge,
    this.enquiryId,
    this.taskId,
    super.key,
  });

  final CrmMobileApi api;
  final UserSession session;
  final Map<String, dynamic>? charge;
  final double outstanding;
  final int? enquiryId;
  final int? taskId;

  @override
  State<WorkCollectionDialog> createState() => _WorkCollectionDialogState();
}

class _WorkCollectionDialogState extends State<WorkCollectionDialog> {
  final _amountController = TextEditingController();
  final _notesController = TextEditingController();
  bool _saving = false;
  String? _error;
  String? _retryKey;
  String? _retryValue;

  @override
  void dispose() {
    _amountController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    final amountText = _amountController.text.trim();
    final amount = double.tryParse(amountText);
    final notes = _notesController.text.trim();
    if (notes.isEmpty) {
      setState(() => _error = 'Enter collection notes before confirming.');
      return;
    }
    if (amount == null ||
        !amount.isFinite ||
        amount <= 0 ||
        amount > widget.outstanding ||
        !RegExp(r'^\d+(\.\d{1,2})?$').hasMatch(amountText)) {
      setState(
        () => _error =
            'Enter an amount up to ₹${widget.outstanding.toStringAsFixed(2)} with at most two decimals.',
      );
      return;
    }
    final value = '$amount\n$notes';
    if (value != _retryValue) {
      _retryValue = value;
      _retryKey =
          'mobile-${DateTime.now().microsecondsSinceEpoch}-${Random.secure().nextInt(0x7fffffff)}';
    }
    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      await widget.api.sendWorkReport(widget.session.accessToken, {
        'enquiryId': widget.enquiryId,
        'taskId': widget.taskId,
        'action': 'collection',
        'body': notes,
        'amount': amount,
        'requestId': _retryKey,
        'latitude': null,
        'longitude': null,
        'accuracyMeters': null,
        'capturedAt': null,
      });
      if (mounted) Navigator.of(context).pop(true);
    } on CrmMobileApiException catch (error) {
      if (mounted) setState(() => _error = error.message);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Record collection'),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (widget.charge != null) ...[
              Text(
                'Opened from charge: ₹${_amount(widget.charge!['amount']).toStringAsFixed(2)}',
              ),
              const SizedBox(height: 4),
            ],
            Text(
              'Collection applies to this record’s outstanding balance: ₹${widget.outstanding.toStringAsFixed(2)}',
            ),
            const SizedBox(height: 12),
            TextField(
              key: const ValueKey('collection-amount'),
              controller: _amountController,
              keyboardType: const TextInputType.numberWithOptions(
                decimal: true,
              ),
              decoration: const InputDecoration(
                labelText: 'Collected amount (₹)',
              ),
            ),
            TextField(
              key: const ValueKey('collection-notes'),
              controller: _notesController,
              maxLines: 3,
              maxLength: 10000,
              decoration: const InputDecoration(
                labelText: 'Collection notes *',
              ),
            ),
            if (_error != null)
              Text(
                _error!,
                style: TextStyle(color: Theme.of(context).colorScheme.error),
              ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: _saving ? null : () => Navigator.of(context).pop(false),
          child: const Text('Cancel'),
        ),
        FilledButton(
          onPressed: _saving || widget.outstanding <= 0 ? null : _save,
          style: FilledButton.styleFrom(
            foregroundColor: Colors.white,
            backgroundColor: const Color(0xFF682A82),
          ),
          child: Text(_saving ? 'Saving…' : 'Confirm collection'),
        ),
      ],
    );
  }
}

double _amount(Object? value) =>
    value is num ? value.toDouble() : double.tryParse('$value') ?? 0;
