import 'dart:async';

import 'package:flutter/widgets.dart';

import '../../core/api/crm_mobile_api.dart';

/// Keeps the Home and Jobs screens on the same fresh CRM snapshot.
///
/// This is view state only. CRM remains the source of truth and all mutations
/// still go through the platform API.
class DashboardJobsFeed extends ChangeNotifier with WidgetsBindingObserver {
  DashboardJobsFeed({required this.api, required this.session}) {
    WidgetsBinding.instance.addObserver(this);
  }

  static const _refreshInterval = Duration(seconds: 12);

  final CrmMobileApi api;
  UserSession session;
  final List<CrmJob> _jobs = [];
  Timer? _timer;
  bool _isLoading = true;
  bool _isRefreshing = false;
  String? _error;
  var _sessionGeneration = 0;

  List<CrmJob> get jobs => List.unmodifiable(_jobs);
  bool get isLoading => _isLoading;
  String? get error => _error;

  void start() {
    _startPolling();
    unawaited(refresh());
  }

  Future<void> refresh() async {
    if (_isRefreshing) return;
    _isRefreshing = true;
    final generation = _sessionGeneration;
    try {
      final updated = await _loadEnquiries();
      if (generation != _sessionGeneration) return;
      _jobs
        ..clear()
        ..addAll(updated);
      _error = null;
    } on Object catch (error) {
      if (generation != _sessionGeneration) return;
      _error = error is CrmMobileApiException
          ? error.message
          : 'Could not refresh live dashboard data.';
    } finally {
      if (generation == _sessionGeneration) {
        _isLoading = false;
        _isRefreshing = false;
        notifyListeners();
      }
    }
  }

  void updateSession(UserSession updatedSession) {
    if (session.accessToken == updatedSession.accessToken) return;
    session = updatedSession;
    _sessionGeneration += 1;
    _isRefreshing = false;
    _isLoading = _jobs.isEmpty;
    unawaited(refresh());
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _startPolling();
      unawaited(refresh());
      return;
    }
    if (state == AppLifecycleState.paused ||
        state == AppLifecycleState.detached) {
      _timer?.cancel();
      _timer = null;
    }
  }

  void _startPolling() {
    _timer ??= Timer.periodic(_refreshInterval, (_) => unawaited(refresh()));
  }

  Future<List<CrmJob>> _loadEnquiries() async {
    try {
      return await api.enquiries(
        accessToken: session.accessToken,
        scope: 'assigned',
        filter: 'active',
      );
    } on CrmMobileApiException {
      return api.assignedJobs(session.accessToken);
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _timer?.cancel();
    super.dispose();
  }
}
