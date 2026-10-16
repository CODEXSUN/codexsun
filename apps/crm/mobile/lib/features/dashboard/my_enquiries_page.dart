import 'package:flutter/material.dart';

import '../../core/api/crm_mobile_api.dart';
import 'admin_call_log_page.dart';
import 'dashboard_list_page.dart';
import 'home_enquiry_form_page.dart';
import 'job_enquiry_card.dart';

class MyEnquiriesPage extends StatefulWidget {
  const MyEnquiriesPage({
    required this.api,
    required this.session,
    this.onSignOut,
    this.embedded = false,
    super.key,
  });

  final CrmMobileApi api;
  final UserSession session;
  final VoidCallback? onSignOut;
  final bool embedded;

  @override
  State<MyEnquiriesPage> createState() => MyEnquiriesPageState();
}

class MyEnquiriesPageState extends State<MyEnquiriesPage> {
  final _searchController = TextEditingController();
  late Future<List<CrmJob>> _enquiries;
  late Future<CrmCallEnquiryFormData> _formData;
  var _listFilter = '';
  var _statusFilter = '';
  var _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _enquiries = _load();
    _formData = _loadFormData();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Widget _buildListFilterButton() => FutureBuilder<CrmCallEnquiryFormData>(
    future: _formData,
    builder: (context, snapshot) => PopupMenuButton<String>(
      tooltip: 'Filter lists',
      enabled: snapshot.hasData,
      icon: Icon(
        _listFilter.isEmpty
            ? Icons.filter_list_rounded
            : Icons.filter_alt_rounded,
      ),
      onSelected: (value) => setState(() {
        _listFilter = value;
        _enquiries = _load();
      }),
      itemBuilder: (context) => [
        const PopupMenuItem(value: '', child: Text('All lists')),
        ...?snapshot.data?.groups.map(
          (group) =>
              PopupMenuItem(value: group.value, child: Text(group.label)),
        ),
      ],
    ),
  );

  Widget _buildStatusFilterButton() => FutureBuilder<CrmCallEnquiryFormData>(
    future: _formData,
    builder: (context, snapshot) => PopupMenuButton<String>(
      tooltip: 'Filter status',
      enabled:
          snapshot.hasData && (snapshot.data?.statuses.isNotEmpty ?? false),
      icon: Icon(_statusFilter.isEmpty ? Icons.flag_outlined : Icons.flag),
      onSelected: (value) => setState(() {
        _statusFilter = value;
        _enquiries = _load();
      }),
      itemBuilder: (context) => [
        const PopupMenuItem(value: '', child: Text('All statuses')),
        ...?snapshot.data?.statuses.map(
          (st) => PopupMenuItem(value: st.name, child: Text(st.name)),
        ),
      ],
    ),
  );

  @override
  Widget build(BuildContext context) {
    final content = Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 4, 16, 4),
          child: Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _searchController,
                  decoration: InputDecoration(
                    hintText: 'Search title, customer, phone...',
                    prefixIcon: const Icon(Icons.search, size: 20),
                    suffixIcon: _searchQuery.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.clear, size: 18),
                            onPressed: () {
                              _searchController.clear();
                              setState(() {
                                _searchQuery = '';
                                _enquiries = _load();
                              });
                            },
                          )
                        : null,
                    isDense: true,
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 10,
                    ),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: Color(0xFFDDD8E0)),
                    ),
                  ),
                  onChanged: (value) {
                    setState(() {
                      _searchQuery = value.trim();
                    });
                  },
                  onSubmitted: (value) {
                    setState(() {
                      _searchQuery = value.trim();
                      _enquiries = _load();
                    });
                  },
                ),
              ),
              if (widget.embedded) ...[
                const SizedBox(width: 4),
                _buildListFilterButton(),
                _buildStatusFilterButton(),
              ],
            ],
          ),
        ),
        Expanded(
          child: FutureBuilder<List<CrmJob>>(
            future: _enquiries,
            builder: (context, snapshot) {
              if (snapshot.connectionState != ConnectionState.done) {
                return const Center(child: CircularProgressIndicator());
              }
              if (snapshot.hasError) return _LoadError(onRetry: refresh);
              final allEnquiries = snapshot.data ?? const <CrmJob>[];
              final enquiries = _filter(allEnquiries);
              if (enquiries.isEmpty) {
                return Center(
                  child: Text(
                    allEnquiries.isEmpty
                        ? 'No enquiries found.'
                        : 'No enquiries are in this list.',
                  ),
                );
              }
              return RefreshIndicator(
                onRefresh: refresh,
                child: ListView.separated(
                  padding: EdgeInsets.fromLTRB(
                    16,
                    6,
                    16,
                    widget.embedded ? 84 : 28,
                  ),
                  itemCount: enquiries.length,
                  separatorBuilder: (_, _) => const SizedBox(height: 14),
                  itemBuilder: (context, index) => JobEnquiryCard(
                    api: widget.api,
                    session: widget.session,
                    enquiry: DashboardListItem.fromCrmJob(enquiries[index]),
                    job: enquiries[index],
                    onJobChanged: refresh,
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );

    if (widget.embedded) {
      return content;
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Enquiries'),
        actions: [
          if (isCallLogAdministrator(widget.session.profile.role))
            IconButton(
              tooltip: 'Call Logs',
              onPressed: _openCallLogs,
              icon: const Icon(Icons.call_outlined),
            ),
          IconButton(
            tooltip: 'New enquiry',
            onPressed: _openNewEnquiry,
            icon: const Icon(Icons.add_rounded),
          ),
          _buildListFilterButton(),
          _buildStatusFilterButton(),
          if (widget.onSignOut != null)
            PopupMenuButton<String>(
              tooltip: 'Account options',
              onSelected: (value) {
                if (value == 'sign-out') widget.onSignOut?.call();
              },
              itemBuilder: (context) => [
                PopupMenuItem<String>(
                  enabled: false,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(widget.session.profile.name),
                      Text(
                        widget.session.profile.email,
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ],
                  ),
                ),
                const PopupMenuDivider(),
                const PopupMenuItem(value: 'sign-out', child: Text('Sign out')),
              ],
            ),
        ],
      ),
      body: content,
      floatingActionButton: FloatingActionButton(
        tooltip: 'New enquiry',
        onPressed: _openNewEnquiry,
        child: const Icon(Icons.add_rounded),
      ),
    );
  }

  Future<List<CrmJob>> _load() async {
    final token = widget.session.accessToken;
    final listId = _listFilter.isNotEmpty ? _listFilter : null;
    try {
      return await widget.api.enquiries(
        accessToken: token,
        scope: 'assigned',
        filter: 'active',
        search: _searchQuery,
        listInId: listId,
      );
    } on CrmMobileApiException {
      return widget.api.assignedJobs(token);
    }
  }

  Future<CrmCallEnquiryFormData> _loadFormData() =>
      widget.api.callEnquiryFormData(widget.session.accessToken);

  Future<void> refresh() => _refresh();

  Future<void> _refresh() async {
    final enquiries = _load();
    setState(() {
      _enquiries = enquiries;
    });
    await enquiries;
  }

  List<CrmJob> _filter(List<CrmJob> enquiries) {
    var filtered = enquiries;
    if (_searchQuery.isNotEmpty) {
      final q = _searchQuery.toLowerCase();
      filtered = filtered.where((enquiry) {
        return enquiry.title.toLowerCase().contains(q) ||
            enquiry.customer.toLowerCase().contains(q) ||
            enquiry.mobile.toLowerCase().contains(q) ||
            enquiry.number.contains(q);
      }).toList();
    }
    if (_listFilter.isNotEmpty) {
      filtered = filtered
          .where(
            (enquiry) =>
                enquiry.list.trim().toLowerCase() ==
                    _listFilter.toLowerCase() ||
                enquiry.listInId == _listFilter,
          )
          .toList();
    }
    if (_statusFilter.isNotEmpty) {
      filtered = filtered
          .where(
            (enquiry) =>
                enquiry.status.trim().toLowerCase() ==
                _statusFilter.toLowerCase(),
          )
          .toList();
    }
    return filtered;
  }

  Future<void> _openNewEnquiry() async {
    final created = await Navigator.of(context).push<CrmJob>(
      MaterialPageRoute(
        builder: (context) =>
            HomeEnquiryFormPage(api: widget.api, session: widget.session),
      ),
    );
    if (created != null && mounted) await _refresh();
  }

  Future<void> _openCallLogs() async {
    await Navigator.of(context).push<void>(
      MaterialPageRoute(
        builder: (context) =>
            AdminCallLogPage(api: widget.api, session: widget.session),
      ),
    );
  }
}

class _LoadError extends StatelessWidget {
  const _LoadError({required this.onRetry});

  final Future<void> Function() onRetry;

  @override
  Widget build(BuildContext context) => Center(
    child: FilledButton.tonal(
      onPressed: onRetry,
      child: const Text('Could not load your enquiries. Retry'),
    ),
  );
}
