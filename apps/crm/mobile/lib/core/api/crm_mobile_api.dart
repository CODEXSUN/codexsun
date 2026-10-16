import 'dart:convert';

import 'package:http/http.dart' as http;

import '../config/app_config.dart';

class CrmMobileApi {
  CrmMobileApi(String baseUrl) : _baseUri = Uri.parse(baseUrl);

  final Uri _baseUri;

  String? get hostHeader => _resolveHostHeader(_baseUri);

  static String? _resolveHostHeader(Uri baseUri) {
    if (baseUri.host != '10.0.2.2') return null;
    final port = baseUri.hasPort ? ':${baseUri.port}' : '';
    return '127.0.0.1$port';
  }

  Future<ApiHealth> health() async {
    return ApiHealth.fromJson(await _request('/health'));
  }

  Future<UserSession> signIn({
    required String email,
    required String password,
    String? corporateId,
  }) async {
    final corp = (corporateId != null && corporateId.trim().isNotEmpty)
        ? corporateId.trim()
        : AppConfig.corporateId;
    final data = await _request(
      '/auth/login',
      body: {
        'desk': 'tenant',
        'email': email,
        'password': password,
        if (corp.isNotEmpty) 'corporateId': corp,
      },
      method: 'POST',
      requestBearerToken: true,
    );
    return UserSession.fromJson(data);
  }

  Future<UserProfile> session(String accessToken) async {
    return UserProfile.fromJson(
      await _request('/auth/session', accessToken: accessToken),
    );
  }

  Future<String> changePassword({
    required String accessToken,
    required UserProfile profile,
    required String password,
  }) async {
    final data = await _request(
      '/identity/profile',
      accessToken: accessToken,
      method: 'PUT',
      body: {
        'email': profile.email,
        'name': profile.name,
        'password': password,
      },
    ) as Map<String, dynamic>;
    return data['accessToken'] as String;
  }

  Future<List<CrmJob>> assignedJobs(String accessToken) async {
    final data = await _request(
      '/crm/enquiries',
      accessToken: accessToken,
      query: const {
        'scope': 'assigned',
        'filter': 'active',
        'page': '1',
        'pageSize': '100',
      },
    );
    if (data is! Map<String, dynamic> || data['items'] is! List) {
      throw const CrmMobileApiException('Unexpected jobs response.');
    }
    return (data['items'] as List)
        .whereType<Map<String, dynamic>>()
        .map(CrmJob.fromJson)
        .toList();
  }

  Future<List<AppNotification>> notifications(String accessToken) async {
    final data = await _request('/notifications', accessToken: accessToken);
    if (data is! List) {
      throw const CrmMobileApiException('Unexpected notifications response.');
    }
    return data
        .whereType<Map<String, dynamic>>()
        .map(AppNotification.fromJson)
        .toList();
  }

  Future<List<CrmJob>> enquiries({
    required String accessToken,
    String scope = 'all',
    String filter = 'all',
    String search = '',
    String? listInId,
    int page = 1,
    int pageSize = 100,
  }) async {
    final query = <String, String>{
      'scope': scope,
      'filter': filter,
      'page': '$page',
      'pageSize': '$pageSize',
      if (search.trim().isNotEmpty) 'search': search.trim(),
      if (listInId != null && listInId.isNotEmpty) 'listInId': listInId,
    };
    final data = await _request(
      '/crm/enquiries',
      accessToken: accessToken,
      query: query,
    );
    if (data is! Map<String, dynamic> || data['items'] is! List) {
      throw const CrmMobileApiException('Unexpected enquiries response.');
    }
    return (data['items'] as List)
        .whereType<Map<String, dynamic>>()
        .map(CrmJob.fromJson)
        .toList();
  }

  Future<List<CrmJob>> createdEnquiries(String accessToken) async {
    final data = await _request(
      '/crm/enquiries',
      accessToken: accessToken,
      query: const {'scope': 'created', 'page': '1', 'pageSize': '100'},
    );
    if (data is! Map<String, dynamic> || data['items'] is! List) {
      throw const CrmMobileApiException(
        'Unexpected created enquiries response.',
      );
    }
    return (data['items'] as List)
        .whereType<Map<String, dynamic>>()
        .map(CrmJob.fromJson)
        .toList();
  }

  Future<List<CrmJob>> assignedJobDetails(String accessToken) async {
    final jobs = await assignedJobs(accessToken);
    return Future.wait(jobs.map((item) => job(accessToken, item.sourceId)));
  }

  Future<int> activitiesCount(String accessToken) async {
    try {
      final data = await _request(
        '/crm/activities',
        accessToken: accessToken,
        query: const {'pageSize': '1'},
      );
      if (data is Map<String, dynamic> && data['total'] is num) {
        return (data['total'] as num).toInt();
      }
    } catch (_) {}
    return 0;
  }

  Future<List<CrmCustomerReference>> customerReferences({
    required String accessToken,
    String search = '',
  }) async {
    final data = await _request(
      '/core/master/contacts',
      accessToken: accessToken,
      query: search.trim().isEmpty ? const {} : {'search': search.trim()},
    );
    if (data is! List) {
      throw const CrmMobileApiException('Unexpected customer lookup response.');
    }
    return data
        .whereType<Map<String, dynamic>>()
        .map(CrmCustomerReference.fromJson)
        .toList();
  }

  Future<List<CrmPartyReference>> partiesByMobile({
    required String accessToken,
    required String mobile,
  }) async {
    final data = await _request(
      '/core/master/contacts',
      accessToken: accessToken,
      query: {'search': mobile},
    );
    if (data is! List) {
      throw const CrmMobileApiException('Unexpected contact lookup response.');
    }
    return data
        .whereType<Map<String, dynamic>>()
        .map(CrmPartyReference.fromJson)
        .toList();
  }

  Future<CrmJob> job(String accessToken, String id) async {
    final data = await _request(
      '/crm/enquiries/${Uri.encodeComponent(id)}',
      accessToken: accessToken,
    );
    final record = data as Map<String, dynamic>;
    final related = await Future.wait([
      _request(
        '/crm/enquiries/${Uri.encodeComponent(id)}/comments',
        accessToken: accessToken,
      ),
      _request(
        '/crm/enquiries/${Uri.encodeComponent(id)}/jobs',
        accessToken: accessToken,
      ),
      _request(
        '/crm/enquiries/${Uri.encodeComponent(id)}/activity',
        accessToken: accessToken,
      ),
    ]);
    return CrmJob.fromJson({
      ...record,
      'messages': (related[0] as List).map((item) {
        final comment = item as Map<String, dynamic>;
        return {
          ...comment,
          'comment': comment['body'],
          'createdByUserId': comment['createdBy'],
        };
      }).toList(),
      'jobs': related[1],
      'activities': related[2],
    });
  }

  Future<List<CrmEnquiryLocation>> enquiryLocations({
    required String accessToken,
    required String enquiryId,
  }) async {
    final data = await _request(
      '/crm/enquiries/${Uri.encodeComponent(enquiryId)}/locations',
      accessToken: accessToken,
    );
    if (data is! Map<String, dynamic> || data['items'] is! List) {
      throw const CrmMobileApiException(
        'Unexpected enquiry locations response.',
      );
    }
    return (data['items'] as List)
        .whereType<Map<String, dynamic>>()
        .map(CrmEnquiryLocation.fromJson)
        .toList();
  }

  Future<CrmEnquiryLocation> logEnquiryLocation({
    required String accessToken,
    required String enquiryId,
    required double latitude,
    required double longitude,
    required double? accuracyMeters,
    required DateTime capturedAt,
  }) async {
    final data = await _request(
      '/crm/enquiries/${Uri.encodeComponent(enquiryId)}/locations',
      accessToken: accessToken,
      method: 'POST',
      body: {
        'latitude': latitude,
        'longitude': longitude,
        'accuracyMeters': accuracyMeters,
        'capturedAt': capturedAt.toUtc().toIso8601String(),
      },
    );
    return CrmEnquiryLocation.fromJson(data as Map<String, dynamic>);
  }

  Future<List<CrmMobileEnquiryMatch>> mobileEnquiries({
    required String accessToken,
    required String mobile,
  }) async {
    final data = await _request(
      '/crm/enquiries',
      accessToken: accessToken,
      query: {'mobile': mobile, 'page': '1', 'pageSize': '100'},
    );
    if (data is! Map<String, dynamic> || data['items'] is! List) {
      throw const CrmMobileApiException('Unexpected mobile enquiry response.');
    }
    return (data['items'] as List)
        .whereType<Map<String, dynamic>>()
        .map(CrmMobileEnquiryMatch.fromJson)
        .toList();
  }

  Future<CrmJob> addJobComment({
    required String accessToken,
    required String id,
    required String comment,
  }) async {
    await _request(
      '/crm/mobile/enquiries/${Uri.encodeComponent(id)}/comments',
      accessToken: accessToken,
      method: 'POST',
      body: {'body': comment, 'bodyFormat': 'plain', 'parentId': null},
    );
    return job(accessToken, id);
  }

  Future<CrmCallEnquiryFormData> callEnquiryFormData(String accessToken) async {
    final options = await _request(
      '/crm/enquiries/options',
      accessToken: accessToken,
    ) as Map<String, dynamic>;
    return CrmCallEnquiryFormData(
      groups: (options['lists'] as List<dynamic>)
          .whereType<Map<String, dynamic>>()
          .map(
            (item) => CrmCallEnquiryGroup(
              label: item['name'] as String,
              value: item['id'] as String,
            ),
          )
          .toList(),
      assignees: (options['users'] as List<dynamic>)
          .whereType<Map<String, dynamic>>()
          .map(
            (item) => CrmCallEnquiryAssignee(
              id: item['id'] as String,
              name: item['name'] as String,
            ),
          )
          .toList(),
      statuses: (options['statuses'] as List? ?? const [])
          .whereType<Map<String, dynamic>>()
          .map(
            (item) => CrmCallEnquiryStatus(
              id: item['id']?.toString() ?? '',
              name: item['name'] as String? ?? '',
              code: item['code'] as String? ?? '',
            ),
          )
          .toList(),
      priorities: (options['priorities'] as List? ?? const [])
          .whereType<Map<String, dynamic>>()
          .map(
            (item) => CrmCallEnquiryPriority(
              id: item['id']?.toString() ?? '',
              name: item['name'] as String? ?? '',
              code: item['code'] as String? ?? '',
            ),
          )
          .toList(),
    );
  }

  Future<CrmJob> createCallEnquiry({
    required String accessToken,
    required String mobile,
    required String customerName,
    required String title,
    required String enquiryGroup,
    required String? assignedToUserId,
    required String message,
    required String direction,
    required int durationSeconds,
    required DateTime occurredAt,
  }) async {
    return createEnquiry(
      accessToken: accessToken,
      customer: customerName,
      mobile: mobile,
      title: title,
      enquiryGroup: enquiryGroup,
      assignedToUserId: assignedToUserId,
      message:
          '$message\n\n${direction.trim()} call · ${durationSeconds}s · ${occurredAt.toLocal()}',
    );
  }

  Future<CrmCallLog> syncDeviceCallLog({
    required String accessToken,
    required String sourceReference,
    required String type,
    required String from,
    required String to,
    required String status,
    required int duration,
    required DateTime occurredAt,
  }) async {
    final data = await _request(
      '/crm/mobile/call-logs',
      accessToken: accessToken,
      method: 'POST',
      body: {
        'type': type,
        'from': from,
        'to': to,
        'status': status,
        'duration': duration,
        'user': null,
        'sourceReference': sourceReference,
        'occurredAt': occurredAt.toUtc().toIso8601String(),
      },
    );
    return CrmCallLog.fromJson(data as Map<String, dynamic>);
  }

  Future<List<CrmCallLogComment>> callLogComments({
    required String accessToken,
    required String callLogName,
  }) async {
    final data = await _request(
      '/crm/call-logs/${Uri.encodeComponent(callLogName)}/comments',
      accessToken: accessToken,
    );
    if (data is! List) {
      throw const CrmMobileApiException(
        'Unexpected call log comments response.',
      );
    }
    return data
        .whereType<Map<String, dynamic>>()
        .map(CrmCallLogComment.fromJson)
        .toList();
  }

  Future<CrmCallLogComment> addCallLogComment({
    required String accessToken,
    required String callLogName,
    required String body,
  }) async {
    final data = await _request(
      '/crm/mobile/call-logs/${Uri.encodeComponent(callLogName)}/comments',
      accessToken: accessToken,
      method: 'POST',
      body: {'body': body},
    );
    return CrmCallLogComment.fromJson(data as Map<String, dynamic>);
  }

  Future<CrmJob> createEnquiry({
    required String accessToken,
    required String customer,
    required String mobile,
    required String title,
    required String enquiryGroup,
    required String? assignedToUserId,
    required String message,
  }) async {
    final options = await _request(
      '/crm/enquiries/options',
      accessToken: accessToken,
    ) as Map<String, dynamic>;
    final statuses = (options['statuses'] as List)
        .whereType<Map<String, dynamic>>();
    final priorities = (options['priorities'] as List)
        .whereType<Map<String, dynamic>>();
    final status = statuses.firstWhere(
      (item) => (item['code'] as String? ?? '').toLowerCase() == 'new',
      orElse: () => statuses.first,
    );
    final priority = priorities.firstWhere(
      (item) => (item['code'] as String? ?? '').toLowerCase() == 'normal',
      orElse: () => priorities.first,
    );
    final data = await _request(
      '/crm/enquiries',
      accessToken: accessToken,
      method: 'POST',
      body: {
        'title': title,
        'description': message,
        'contactId': int.tryParse(customer),
        'capturedName': int.tryParse(customer) == null ? customer : null,
        'capturedEmail': null,
        'capturedPhone': mobile,
        'source': 'mobile',
        'sourceReference': null,
        'listInId': enquiryGroup,
        'statusId': status['id'],
        'priorityId': priority['id'],
        'assignedUserId': assignedToUserId,
        'enquiredAt': DateTime.now().toUtc().toIso8601String(),
        'dueDate': null,
        'closedReason': null,
      },
    );
    return CrmJob.fromJson(data as Map<String, dynamic>);
  }

  Future<CrmJob> startJob({
    required String accessToken,
    required String id,
  }) async {
    await _request(
      '/crm/enquiries/${Uri.encodeComponent(id)}/jobs/start',
      accessToken: accessToken,
      method: 'POST',
      body: const {},
    );
    return job(accessToken, id);
  }

  Future<List<CrmDuty>> duties(String accessToken) async {
    final data = await _request('/crm/duties', accessToken: accessToken);
    final reportData = await _request('/crm/duty-reports?scope=own&page=1&pageSize=100', accessToken: accessToken);
    final reportsPage = reportData is Map<String, dynamic> ? reportData['items'] : reportData;
    if (data is! List || reportsPage is! List)
      throw const CrmMobileApiException('Unexpected duties response.');
    final reports = reportsPage.whereType<Map<String, dynamic>>().map(CrmDutyReport.fromJson).toList();
    return data.whereType<Map<String, dynamic>>().map((item) {
      final id = item['id'] is int ? item['id'] as int : int.tryParse('${item['id']}') ?? -1;
      return CrmDuty.fromJson({...item, 'reports': reports.where((report) => report.assignmentId == id).map((report) => report.toJson()).toList()});
    }).toList();
  }

  Future<CrmDutyReport> reportDuty({
    required String accessToken,
    required int assignmentId,
    required String actions,
    required String result,
    required String issueDetails,
  }) async {
    final data = await _request(
      '/crm/duty-reports',
      accessToken: accessToken,
      method: 'POST',
      body: {
        'assignmentId': assignmentId,
        'performedDate': DateTime.now().toUtc().toIso8601String().substring(0, 10),
        'actions': actions,
        'result': result,
        'issueDetails': issueDetails,
      },
    );
    return CrmDutyReport.fromJson(data as Map<String, dynamic>);
  }

  Future<CrmJob> stopJob({
    required String accessToken,
    required String id,
    required String jobName,
  }) async {
    await _request(
      '/crm/enquiries/${Uri.encodeComponent(id)}/jobs/${Uri.encodeComponent(jobName)}/stop',
      accessToken: accessToken,
      method: 'POST',
      body: const {},
    );
    return job(accessToken, id);
  }

  Future<CrmJob> openNewCall({
    required String accessToken,
    required String id,
  }) async {
    await _request(
      '/crm/enquiries/${Uri.encodeComponent(id)}/open-new-call',
      accessToken: accessToken,
      method: 'POST',
      body: const {},
    );
    return job(accessToken, id);
  }

  Future<CrmJob> updateProperties({
    required String accessToken,
    required String id,
    String? statusId,
    String? priorityId,
    String? listInId,
    String? assignedUserId,
    String? dueDate,
    String? closedReason,
  }) async {
    final payload = <String, dynamic>{};
    if (statusId != null) payload['statusId'] = statusId;
    if (priorityId != null) payload['priorityId'] = priorityId;
    if (listInId != null) payload['listInId'] = listInId;
    if (assignedUserId != null) payload['assignedUserId'] = assignedUserId;
    if (dueDate != null) payload['dueDate'] = dueDate;
    if (closedReason != null) payload['closedReason'] = closedReason;
    await _request(
      '/crm/enquiries/${Uri.encodeComponent(id)}/properties',
      accessToken: accessToken,
      method: 'PATCH',
      body: payload,
    );
    return job(accessToken, id);
  }

  Future<ClosureRequest?> latestClosureRequest({
    required String accessToken,
    required String id,
  }) async {
    final data = await _request(
      '/crm/enquiries/${Uri.encodeComponent(id)}/closure-requests/latest',
      accessToken: accessToken,
    );
    if (data is! Map<String, dynamic>) {
      throw const CrmMobileApiException('Unexpected closure request response.');
    }
    final item = data['item'];
    if (item == null) return null;
    if (item is! Map<String, dynamic>) {
      throw const CrmMobileApiException('Unexpected closure request response.');
    }
    return ClosureRequest.fromJson(item);
  }

  Future<ClosureRequest> requestClosure({
    required String accessToken,
    required String id,
    String note = '',
  }) async {
    final data = await _request(
      '/crm/enquiries/${Uri.encodeComponent(id)}/closure-requests',
      accessToken: accessToken,
      method: 'POST',
      body: {'note': note},
    );
    if (data is! Map<String, dynamic>) {
      throw const CrmMobileApiException('Unexpected closure request response.');
    }
    return ClosureRequest.fromJson(data);
  }

  Future<List<MessagingConversation>> conversations({
    required String accessToken,
    required String currentEmail,
  }) async {
    final data = await _request(
      '/chat/channels',
      accessToken: accessToken,
      query: const {'limit': '100'},
    );
    if (data is! List) {
      throw const CrmMobileApiException('Unexpected channels response.');
    }
    return data
        .whereType<Map<String, dynamic>>()
        .map((item) => MessagingConversation.fromJson(item, currentEmail))
        .toList();
  }

  Future<List<MessagingContact>> messagingContacts({
    required String accessToken,
    String search = '',
  }) async {
    final data = await _request(
      '/chat/users',
      accessToken: accessToken,
      query: {if (search.trim().isNotEmpty) 'search': search.trim()},
    );
    if (data is! List) {
      throw const CrmMobileApiException('Unexpected contacts response.');
    }
    return data
        .whereType<Map<String, dynamic>>()
        .map(MessagingContact.fromJson)
        .toList();
  }

  Future<MessagingConversation> openDirectConversation({
    required String accessToken,
    required String currentEmail,
    required MessagingContact contact,
  }) async {
    try {
      final existingChannels = await conversations(
        accessToken: accessToken,
        currentEmail: currentEmail,
      );
      for (final conv in existingChannels) {
        if (conv.kind == 'dm' &&
            (conv.title.toLowerCase() == contact.name.toLowerCase() ||
                conv.title.toLowerCase() == contact.email.toLowerCase())) {
          return conv;
        }
      }
    } catch (_) {}

    final data = await _request(
      '/chat/channels',
      accessToken: accessToken,
      method: 'POST',
      body: {
        'name': contact.name.isNotEmpty ? contact.name : contact.email,
        'kind': 'dm',
        'members': [contact.email],
      },
    );
    return MessagingConversation.fromJson(
      data as Map<String, dynamic>,
      currentEmail,
    );
  }

  Future<List<MessagingMessage>> messages(
    String accessToken,
    dynamic conversationId,
  ) async {
    final channelUuid = conversationId.toString();
    final data = await _request(
      '/chat/messages',
      accessToken: accessToken,
      query: {'channelUuid': channelUuid, 'limit': '100'},
    );
    if (data is! List) {
      throw const CrmMobileApiException('Unexpected messages response.');
    }
    return data
        .whereType<Map<String, dynamic>>()
        .map(MessagingMessage.fromJson)
        .toList();
  }

  Future<MessagingMessage> sendMessage({
    required String accessToken,
    required dynamic conversationId,
    required String content,
  }) async {
    final channelUuid = conversationId.toString();
    return MessagingMessage.fromJson(
      await _request(
        '/chat/messages',
        accessToken: accessToken,
        method: 'POST',
        body: {'channelUuid': channelUuid, 'body': content},
      ) as Map<String, dynamic>,
    );
  }

  Future<void> markConversationRead({
    required String accessToken,
    required dynamic conversationId,
    int? messageId,
  }) async {
    final channelUuid = conversationId.toString();
    await _request(
      '/chat/channels/$channelUuid/read',
      accessToken: accessToken,
      method: 'POST',
      body: {},
    );
  }

  Future<dynamic> _request(
    String path, {
    String? accessToken,
    Map<String, dynamic>? body,
    String method = 'GET',
    Map<String, String>? query,
    bool requestBearerToken = false,
  }) async {
    final request = http.Request(
      method,
      _baseUri.replace(path: '${_baseUri.path}$path', queryParameters: query),
    );
    request.headers['Accept'] = 'application/json';
    final host = hostHeader;
    if (host != null) request.headers['Host'] = host;
    if (requestBearerToken) request.headers['x-auth-token-delivery'] = 'bearer';
    if (accessToken != null) {
      request.headers['Authorization'] = 'Bearer $accessToken';
      request.headers['x-company-id'] = '1';
    }
    if (body != null) {
      request.headers['Content-Type'] = 'application/json';
      request.body = jsonEncode(body);
    }
    final response = await request.send();
    final payload = jsonDecode(
      utf8.decode(await response.stream.toBytes()),
    ) as Map<String, dynamic>;
    if (payload['success'] != true || response.statusCode >= 400) {
      final error = payload['error'];
      final message = switch (error) {
        String msg => msg,
        Map<String, dynamic> err =>
          err['message'] as String? ?? 'Request failed.',
        _ => payload['message'] as String? ?? 'Request failed.',
      };
      throw CrmMobileApiException(message);
    }
    return payload['data'];
  }
}

class ApiHealth {
  const ApiHealth({required this.isHealthy});

  final bool isHealthy;

  factory ApiHealth.fromJson(Map<String, dynamic> json) {
    return ApiHealth(isHealthy: json['status'] == 'ok');
  }
}

class UserSession {
  const UserSession({required this.accessToken, required this.profile});

  final String accessToken;
  final UserProfile profile;

  factory UserSession.fromJson(Map<String, dynamic> json) {
    return UserSession(
      accessToken: json['accessToken'] as String,
      profile: UserProfile.fromJson(json),
    );
  }
}

class AppNotification {
  const AppNotification({
    required this.id,
    required this.title,
    required this.body,
    required this.type,
  });

  factory AppNotification.fromJson(Map<String, dynamic> json) =>
      AppNotification(
        id: json['id'] as int? ?? 0,
        title: json['title'] as String? ?? AppConfig.brandName,
        body: json['body'] as String? ?? '',
        type: json['type'] as String? ?? '',
      );

  final int id;
  final String title;
  final String body;
  final String type;
}

class CrmCustomerReference {
  const CrmCustomerReference({required this.id, required this.name});

  factory CrmCustomerReference.fromJson(Map<String, dynamic> json) =>
      CrmCustomerReference(
        id: json['id']?.toString() ?? '',
        name: json['name'] as String? ?? '',
      );

  final String id;
  final String name;
}

class CrmPartyReference extends CrmCustomerReference {
  const CrmPartyReference({
    required super.id,
    required super.name,
    required this.type,
  });

  factory CrmPartyReference.fromJson(Map<String, dynamic> json) =>
      CrmPartyReference(
        id: json['id']?.toString() ?? '',
        name: json['name'] as String? ?? '',
        type: json['type'] as String? ?? 'Customer',
      );

  final String type;
}

class UserProfile {
  const UserProfile({
    required this.email,
    required this.name,
    required this.role,
  });

  final String email;
  final String name;
  final String role;

  factory UserProfile.fromJson(Map<String, dynamic> json) {
    final email = json['email'] as String? ?? '';
    final explicitRole = json['role'] as String?;
    final userType = json['userType'] as String?;
    final derivedRole =
        explicitRole ??
        ((userType == 'tenant' || email.toLowerCase().startsWith('admin@'))
            ? 'admin'
            : 'user');
    return UserProfile(
      email: email,
      name: json['name'] as String? ?? email,
      role: derivedRole,
    );
  }
}

class CrmMobileApiException implements Exception {
  const CrmMobileApiException(this.message);

  final String message;
}

class ClosureRequest {
  const ClosureRequest({
    required this.id,
    required this.status,
    required this.requestedAt,
    this.reviewNote,
  });

  final int id;
  final String status;
  final String requestedAt;
  final String? reviewNote;

  factory ClosureRequest.fromJson(Map<String, dynamic> json) => ClosureRequest(
    id: json['id'] as int,
    status: json['status'] as String,
    requestedAt: json['requestedAt'] as String,
    reviewNote: json['reviewNote'] as String?,
  );
}

class CrmEnquiryLocation {
  const CrmEnquiryLocation({
    required this.id,
    required this.latitude,
    required this.longitude,
    required this.capturedAt,
    required this.createdBy,
    this.accuracyMeters,
  });

  final int id;
  final double latitude;
  final double longitude;
  final DateTime capturedAt;
  final String createdBy;
  final double? accuracyMeters;

  factory CrmEnquiryLocation.fromJson(Map<String, dynamic> json) =>
      CrmEnquiryLocation(
        id: (json['id'] as num).toInt(),
        latitude: (json['latitude'] as num).toDouble(),
        longitude: (json['longitude'] as num).toDouble(),
        capturedAt: DateTime.parse(json['capturedAt'] as String),
        createdBy: json['createdBy'] as String? ?? '',
        accuracyMeters: (json['accuracyMeters'] as num?)?.toDouble(),
      );
}

class CrmCallEnquiryFormData {
  const CrmCallEnquiryFormData({
    required this.groups,
    required this.assignees,
    this.statuses = const [],
    this.priorities = const [],
  });

  final List<CrmCallEnquiryGroup> groups;
  final List<CrmCallEnquiryAssignee> assignees;
  final List<CrmCallEnquiryStatus> statuses;
  final List<CrmCallEnquiryPriority> priorities;
}

class CrmCallEnquiryStatus {
  const CrmCallEnquiryStatus({
    required this.id,
    required this.name,
    required this.code,
  });

  final String id;
  final String name;
  final String code;
}

class CrmCallEnquiryPriority {
  const CrmCallEnquiryPriority({
    required this.id,
    required this.name,
    required this.code,
  });

  final String id;
  final String name;
  final String code;
}

class CrmCallEnquiryGroup {
  const CrmCallEnquiryGroup({required this.label, required this.value});

  final String label;
  final String value;

  factory CrmCallEnquiryGroup.fromJson(Map<String, dynamic> json) =>
      CrmCallEnquiryGroup(
        label: json['label'] as String? ?? '',
        value: json['value'] as String? ?? '',
      );
}

class CrmCallEnquiryAssignee {
  const CrmCallEnquiryAssignee({required this.id, required this.name});

  final String id;
  final String name;

  factory CrmCallEnquiryAssignee.fromJson(Map<String, dynamic> json) =>
      CrmCallEnquiryAssignee(
        id: json['id'] as String? ?? '',
        name: json['name'] as String? ?? '',
      );
}

class CrmMobileEnquiryMatch {
  const CrmMobileEnquiryMatch({
    required this.enquiryId,
    required this.number,
    required this.title,
    required this.status,
    required this.createdAt,
  });

  final String enquiryId;
  final int number;
  final String title;
  final String status;
  final DateTime createdAt;

  factory CrmMobileEnquiryMatch.fromJson(Map<String, dynamic> json) =>
      CrmMobileEnquiryMatch(
        enquiryId: json['id']?.toString() ?? '',
        number: int.tryParse((json['enquiryNo'] ?? json['id']).toString()) ?? 0,
        title: json['title'] as String? ?? 'Untitled enquiry',
        status: json['status'] as String? ?? 'Open',
        createdAt:
            DateTime.tryParse(json['createdAt'] as String? ?? '') ??
            DateTime.fromMillisecondsSinceEpoch(0),
      );
}

class CrmCallLog {
  const CrmCallLog({required this.name});

  final String name;

  factory CrmCallLog.fromJson(Map<String, dynamic> json) =>
      CrmCallLog(name: json['name'] as String? ?? '');
}

class CrmCallLogComment {
  const CrmCallLogComment({
    required this.id,
    required this.body,
    required this.createdAt,
    required this.createdBy,
  });

  final int id;
  final String body;
  final DateTime createdAt;
  final String createdBy;

  factory CrmCallLogComment.fromJson(Map<String, dynamic> json) =>
      CrmCallLogComment(
        id: (json['id'] as num?)?.toInt() ?? 0,
        body: _plainTextComment(json['body'] as String? ?? ''),
        createdAt:
            DateTime.tryParse(json['createdAt'] as String? ?? '') ??
            DateTime.fromMillisecondsSinceEpoch(0),
        createdBy: json['createdBy'] as String? ?? '',
      );
}

class CrmJob {
  const CrmJob({
    required this.id,
    required this.sourceId,
    required this.number,
    required this.title,
    required this.customer,
    this.mobile = '',
    this.assignedTo = '',
    required this.list,
    required this.dueDate,
    required this.createdBy,
    required this.createdAt,
    required this.lastAction,
    required this.status,
    required this.priority,
    this.statusId = '',
    this.priorityId = '',
    this.listInId = '',
    required this.comments,
    required this.jobs,
    required this.activities,
  });

  final int id;
  final String sourceId;
  final String number;
  final String title;
  final String customer;
  final String mobile;
  final String assignedTo;
  final String list;
  final String dueDate;
  final String createdBy;
  final DateTime createdAt;
  final String lastAction;
  final String status;
  final String priority;
  final String statusId;
  final String priorityId;
  final String listInId;
  final List<CrmComment> comments;
  final List<CrmJobExecution> jobs;
  final List<CrmActivity> activities;

  factory CrmJob.fromJson(Map<String, dynamic> json) {
    final comments = (json['messages'] as List? ?? [])
        .whereType<Map<String, dynamic>>()
        .toList();
    final schedule = (json['schedules'] as List? ?? [])
        .whereType<Map<String, dynamic>>()
        .toList();
    final sourceId = (json['id'] ?? json['uuid'] ?? '').toString();
    final customerName =
        json['contactName'] as String? ??
        json['capturedName'] as String? ??
        json['customerName'] as String? ??
        '';
    return CrmJob(
      id: int.tryParse(sourceId) ?? 0,
      sourceId: sourceId,
      number: (json['enquiryNo'] ?? sourceId).toString().replaceAll(
        RegExp(r'[^0-9]'),
        '',
      ),
      title: json['title'] as String? ?? 'Untitled enquiry',
      customer: customerName.isNotEmpty
          ? customerName
          : json['customer'] as String? ?? 'Customer',
      mobile:
          json['capturedPhone'] as String? ?? json['mobile'] as String? ?? '',
      assignedTo:
          json['assignedToName'] as String? ??
          _assignedToName(json['assignedTo']),
      list:
          json['listIn'] as String? ??
          json['enquiryGroup'] as String? ??
          'General',
      dueDate: _dateLabel(
        json['dueDate'] as String? ??
            (schedule.isEmpty
                ? null
                : schedule.first['scheduledOn'] as String?),
      ),
      createdBy: json['createdBy'] is Map<String, dynamic>
          ? (json['createdBy'] as Map<String, dynamic>)['name'] as String? ??
                AppConfig.brandName
          : json['createdBy'] as String? ?? AppConfig.brandName,
      createdAt:
          DateTime.tryParse(
            json['createdAt'] as String? ?? json['enquiredAt'] as String? ?? '',
          ) ??
          DateTime.now(),
      lastAction: comments.isEmpty
          ? (json['description'] as String? ?? 'No recent activity')
          : comments.last['comment'] as String? ??
                comments.last['body'] as String? ??
                'No recent activity',
      status:
          json['statusName'] as String? ?? json['status'] as String? ?? 'open',
      priority:
          json['priorityName'] as String? ??
          json['priority'] as String? ??
          'normal',
      statusId: json['statusId']?.toString() ?? '',
      priorityId: json['priorityId']?.toString() ?? '',
      listInId: json['listInId']?.toString() ?? '',
      comments: comments.map(CrmComment.fromJson).toList(),
      jobs: (json['jobs'] as List? ?? [])
          .whereType<Map<String, dynamic>>()
          .map(CrmJobExecution.fromJson)
          .toList(),
      activities: (json['activities'] as List? ?? [])
          .whereType<Map<String, dynamic>>()
          .map(CrmActivity.fromJson)
          .toList(),
    );
  }
}

class CrmDuty {
  const CrmDuty({
    required this.assignmentId,
    required this.department,
    required this.frequency,
    required this.index,
    required this.reports,
    required this.sopItem,
    required this.sopName,
    required this.steps,
  });

  final String department;
  final int assignmentId;
  final String frequency;
  final int index;
  final List<CrmDutyReport> reports;
  final String sopItem;
  final String sopName;
  final String steps;

  factory CrmDuty.fromJson(Map<String, dynamic> json) => CrmDuty(
        assignmentId: json['id'] is int
            ? json['id'] as int
            : int.tryParse(json['sopItem'] as String? ?? '') ?? 0,
    department: json['department'] as String? ?? '',
    frequency: json['frequency'] as String? ?? 'Daily',
    index: json['index'] as int? ?? 0,
    reports: (json['reports'] as List? ?? [])
        .whereType<Map<String, dynamic>>()
        .map(CrmDutyReport.fromJson)
        .toList(),
        sopItem: (json['sopItemId'] ?? json['sopItem'] ?? '').toString(),
        sopName: json['itemTitle'] is String
            ? '${json['sopTitle'] ?? 'SOP'} · ${json['itemTitle']}'
            : json['sopName'] as String? ?? '',
        steps: _plainTextComment(
          json['instructions'] as String? ?? json['steps'] as String? ?? '',
        ),
  );
}

class CrmDutyReport {
  const CrmDutyReport({
    required this.actions,
    required this.createdAt,
    required this.date,
    required this.name,
    required this.assignmentId,
  });

  final String actions;
  final DateTime createdAt;
  final String date;
  final String name;
  final int assignmentId;

  Map<String, dynamic> toJson() => {
    'actions': actions,
    'createdAt': createdAt.toIso8601String(),
    'date': date,
    'name': name,
    'assignmentId': assignmentId,
  };

  factory CrmDutyReport.fromJson(Map<String, dynamic> json) => CrmDutyReport(
    actions: _plainTextComment(json['actions'] as String? ?? ''),
    createdAt:
        DateTime.tryParse(json['createdAt'] as String? ?? '') ?? DateTime.now(),
    date: json['performedDate'] as String? ?? json['date'] as String? ?? '',
    name: (json['name'] ?? json['id'] ?? '').toString(),
    assignmentId: json['assignmentId'] is int ? json['assignmentId'] as int : int.tryParse('${json['assignmentId']}') ?? -1,
  );
}

String _assignedToName(Object? value) {
  if (value is! Map<String, dynamic>) return '';
  return value['title'] as String? ?? value['name'] as String? ?? '';
}

class CrmJobExecution {
  const CrmJobExecution({
    required this.name,
    required this.employee,
    required this.createdAt,
    required this.date,
    required this.startTime,
    required this.stopTime,
    required this.hours,
    required this.employeeCostPerHour,
    required this.totalCost,
    required this.status,
  });

  final String name;
  final String employee;
  final DateTime createdAt;
  final String? date;
  final String startTime;
  final String? stopTime;
  final double hours;
  final double employeeCostPerHour;
  final double totalCost;
  final String status;

  bool get isRunning => status == 'Running';

  factory CrmJobExecution.fromJson(
    Map<String, dynamic> json,
  ) => CrmJobExecution(
    name: json['id']?.toString() ?? json['name'] as String? ?? '',
    employee: json['employee'] as String? ?? '',
    createdAt:
        DateTime.tryParse(json['createdAt'] as String? ?? '') ?? DateTime.now(),
    date: json['date'] as String? ?? json['startAt'] as String?,
    startTime: json['startTime'] as String? ?? json['startAt'] as String? ?? '',
    stopTime: json['stopTime'] as String? ?? json['stopAt'] as String?,
    hours: json['hours'] is num
        ? (json['hours'] as num).toDouble()
        : ((json['durationSeconds'] as num? ?? 0).toDouble() / 3600),
    employeeCostPerHour:
        (json['employeeCostPerHour'] as num? ??
                json['ratePerHour'] as num? ??
                0)
            .toDouble(),
    totalCost: (json['totalCost'] as num? ?? 0).toDouble(),
    status: (json['status'] as String? ?? 'Running').toLowerCase() == 'running'
        ? 'Running'
        : (json['status'] as String? ?? 'Completed'),
  );
}

class CrmActivity {
  const CrmActivity({
    required this.id,
    required this.action,
    required this.details,
    required this.createdAt,
    required this.createdBy,
  });

  final String id;
  final String action;
  final String details;
  final DateTime createdAt;
  final String createdBy;

  factory CrmActivity.fromJson(Map<String, dynamic> json) => CrmActivity(
    id: json['uuid']?.toString() ?? json['id']?.toString() ?? '',
    action: json['action'] as String? ?? 'updated',
    details: _plainTextComment(json['details'] as String? ?? ''),
    createdAt:
        DateTime.tryParse(json['createdAt'] as String? ?? '') ?? DateTime.now(),
    createdBy: json['createdBy'] as String? ?? '',
  );
}

class CrmComment {
  const CrmComment({
    required this.id,
    required this.comment,
    required this.createdAt,
    required this.createdByUserId,
  });

  final String id;
  final String comment;
  final DateTime createdAt;
  final String createdByUserId;

  factory CrmComment.fromJson(Map<String, dynamic> json) => CrmComment(
    id: json['id']?.toString() ?? '',
    comment: _plainTextComment(
      json['comment'] as String? ?? json['body'] as String? ?? '',
    ),
    createdAt:
        DateTime.tryParse(json['createdAt'] as String? ?? '') ?? DateTime.now(),
    createdByUserId:
        json['createdByUserId'] as String? ??
        json['createdBy'] as String? ??
        AppConfig.brandName,
  );
}

String _plainTextComment(String value) {
  var text = value
      .replaceAll(
        RegExp(
          r'<(?:script|style)\b[^>]*>.*?</(?:script|style)>',
          caseSensitive: false,
          dotAll: true,
        ),
        '',
      )
      .replaceAll(RegExp(r'<br\s*/?>', caseSensitive: false), '\n')
      .replaceAll(RegExp(r'</(?:div|li|p)>', caseSensitive: false), '\n')
      .replaceAll(RegExp(r'<li\b[^>]*>', caseSensitive: false), '• ')
      .replaceAll(RegExp(r'<[^>]+>'), '');

  text = text.replaceAllMapped(RegExp(r'&#(?:x([0-9a-fA-F]+)|(\d+));'), (
    match,
  ) {
    final hexadecimal = match.group(1);
    final codePoint = int.tryParse(
      hexadecimal ?? match.group(2)!,
      radix: hexadecimal == null ? 10 : 16,
    );
    if (codePoint == null ||
        codePoint < 0 ||
        codePoint > 0x10FFFF ||
        (codePoint >= 0xD800 && codePoint <= 0xDFFF)) {
      return '';
    }
    return String.fromCharCode(codePoint);
  });

  const entities = {
    '&nbsp;': ' ',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
    '&lt;': '<',
    '&gt;': '>',
    '&amp;': '&',
  };
  for (final entry in entities.entries) {
    text = text.replaceAll(entry.key, entry.value);
  }

  return text
      .split('\n')
      .map((line) => line.replaceAll(RegExp(r'[ \t]+'), ' ').trim())
      .where((line) => line.isNotEmpty)
      .join('\n')
      .trim();
}

class MessagingConversation {
  const MessagingConversation({
    required this.id,
    required this.uuid,
    required this.title,
    required this.preview,
    required this.updatedAt,
    required this.unreadCount,
    this.kind = 'channel',
  });

  final int id;
  final String uuid;
  final String title;
  final String preview;
  final DateTime updatedAt;
  final int unreadCount;
  final String kind;

  String get channelIdentifier => uuid.isNotEmpty ? uuid : '$id';

  factory MessagingConversation.fromJson(
    Map<String, dynamic> json,
    String currentEmail,
  ) {
    final last = json['lastMessage'] as Map<String, dynamic>?;
    final members = (json['members'] as List? ?? [])
        .whereType<Map<String, dynamic>>()
        .toList();
    final id = json['id'] is int
        ? json['id'] as int
        : (int.tryParse('${json['id']}') ?? 0);
    final uuid = json['uuid'] as String? ?? (id > 0 ? '$id' : '');
    final name = json['name'] as String? ?? json['title'] as String?;
    final title = (name != null && name.isNotEmpty)
        ? name
        : (members.isEmpty
              ? 'Conversation'
              : _otherMemberName(members, currentEmail));
    final preview =
        json['lastMessagePreview'] as String? ??
        last?['content'] as String? ??
        last?['body'] as String? ??
        'No messages yet';
    final updatedAt =
        DateTime.tryParse(
          json['lastMessageAt'] as String? ??
              json['updatedAt'] as String? ??
              '',
        ) ??
        DateTime.now();
    final unreadCount = json['unreadCount'] as int? ?? 0;
    final kind = json['kind'] as String? ?? 'channel';

    return MessagingConversation(
      id: id,
      uuid: uuid,
      title: title,
      preview: preview,
      updatedAt: updatedAt,
      unreadCount: unreadCount,
      kind: kind,
    );
  }
}

class MessagingContact {
  const MessagingContact({
    required this.id,
    required this.name,
    required this.email,
  });

  final int id;
  final String name;
  final String email;

  factory MessagingContact.fromJson(Map<String, dynamic> json) {
    final email = json['email'] as String? ?? '';
    final rawId = json['id'];
    final id = rawId is int
        ? rawId
        : (int.tryParse('$rawId') ?? email.hashCode.abs());
    return MessagingContact(
      id: id,
      name: json['name'] as String? ?? 'CRM user',
      email: email,
    );
  }
}

class MessagingMessage {
  const MessagingMessage({
    required this.id,
    required this.uuid,
    required this.channelUuid,
    required this.senderName,
    required this.senderEmail,
    required this.content,
    required this.createdAt,
    required this.status,
  });

  final int id;
  final String uuid;
  final String channelUuid;
  final String senderName;
  final String senderEmail;
  final String content;
  final DateTime createdAt;
  final String status;

  factory MessagingMessage.fromJson(Map<String, dynamic> json) {
    final senderEmail =
        (json['senderEmail'] ?? json['sender_email'] ?? '') as String;
    final senderName =
        json['senderName'] as String? ??
        (senderEmail.isNotEmpty ? senderEmail.split('@').first : 'User');
    final content = (json['body'] ?? json['content'] ?? '') as String;
    final rawId = json['id'];
    final id = rawId is int ? rawId : (int.tryParse('$rawId') ?? 0);
    final uuid = json['uuid'] as String? ?? (id > 0 ? '$id' : '');
    final channelUuid =
        (json['channelUuid'] ?? json['channel_uuid'] ?? '') as String;

    return MessagingMessage(
      id: id,
      uuid: uuid,
      channelUuid: channelUuid,
      senderName: senderName,
      senderEmail: senderEmail,
      content: content,
      createdAt:
          DateTime.tryParse(json['createdAt'] as String? ?? '') ??
          DateTime.now(),
      status: json['status'] as String? ?? 'active',
    );
  }
}

String _dateLabel(String? value) {
  if (value == null || value.isEmpty) return 'Not scheduled';
  final date = DateTime.tryParse(value);
  if (date == null) return value;
  return '${date.day.toString().padLeft(2, '0')} ${_months[date.month - 1]}';
}

String _otherMemberName(
  List<Map<String, dynamic>> members,
  String currentEmail,
) {
  final member = members.cast<Map<String, dynamic>?>().firstWhere(
    (item) =>
        item?['email']?.toString().toLowerCase() != currentEmail.toLowerCase(),
    orElse: () => members.isEmpty ? null : members.first,
  );
  return member?['userName'] as String? ?? 'Conversation';
}

const _months = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];
