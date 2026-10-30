import 'dart:convert';

import 'package:http/http.dart' as http;

class PortalApi {
  PortalApi(this.baseUrl);
  final String baseUrl;
  String cookie = '';
  String sessionSlot = '';
  Map<String, dynamic>? context;
  void Function()? onSessionExpired;
  final http.Client _client = http.Client();
  Map<String, String> get headers => {
    'Content-Type': 'application/json',
    'x-auth-desk': 'tenant',
    if (cookie.isNotEmpty) 'Cookie': cookie,
    if (sessionSlot.isNotEmpty) 'x-codexsun-session-slot': sessionSlot,
  };
  Future<void> login(String corporateId, String email, String password) async {
    final response = await _client
        .post(
          Uri.parse('$baseUrl/auth/login'),
          headers: headers,
          body: jsonEncode({
            'desk': 'tenant',
            'corporateId': corporateId,
            'email': email,
            'password': password,
          }),
        )
        .timeout(const Duration(seconds: 20));
    final data = decode(response) as Map<String, dynamic>;
    final slot = data['sessionSlot'];
    if (slot is! String || !RegExp(r'^[a-f0-9]{32}$').hasMatch(slot)) {
      throw Exception('A device session is required.');
    }
    final match = RegExp('((?:__Host-)?codexsun_session_$slot=[^;,]+)')
        .firstMatch(response.headers['set-cookie'] ?? '');
    if (match == null) {
      throw Exception('A protected session cookie is required.');
    }
    sessionSlot = slot;
    cookie = match.group(1)!;
    try {
      context = await get('/codexsun/context') as Map<String, dynamic>;
    } catch (_) {
      clear();
      rethrow;
    }
  }

  bool can(String permission) => context?['permissions']?[permission] == true;
  Future<dynamic> get(String path) async => decode(
    await _client
        .get(Uri.parse('$baseUrl$path'), headers: headers)
        .timeout(const Duration(seconds: 20)),
  );
  Future<dynamic> post(String path, Map<String, dynamic> body) async => decode(
    await _client
        .post(
          Uri.parse('$baseUrl$path'),
          headers: headers,
          body: jsonEncode(body),
        )
        .timeout(const Duration(seconds: 20)),
  );
  dynamic decode(http.Response response) {
    Map<String, dynamic> envelope;
    try {
      envelope = jsonDecode(response.body) as Map<String, dynamic>;
    } catch (_) {
      throw Exception('The server returned an unreadable response.');
    }
    if (response.statusCode >= 400 || envelope['success'] != true) {
      if (response.statusCode == 401 || response.statusCode == 403) {
        clear();
        onSessionExpired?.call();
      }
      throw Exception(envelope['error']?['message'] ?? 'Request failed.');
    }
    return envelope['data'];
  }

  Future<void> logout() async {
    try {
      await post('/auth/logout', {});
    } finally {
      clear();
    }
  }

  void clear() {
    cookie = '';
    sessionSlot = '';
    context = null;
  }

  void dispose() {
    clear();
    _client.close();
  }
}
