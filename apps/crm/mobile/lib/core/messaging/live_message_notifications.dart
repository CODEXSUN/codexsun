import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:web_socket_channel/web_socket_channel.dart';

import '../api/crm_mobile_api.dart';
import '../config/app_config.dart';

class LiveMessageNotifications extends ChangeNotifier {
  LiveMessageNotifications({
    required this.api,
    required this.session,
    this.onNewUnreadMessages,
  });

  final CrmMobileApi api;
  UserSession session;
  final ValueChanged<int>? onNewUnreadMessages;

  WebSocketChannel? _channel;
  Timer? _poller;
  Timer? _reconnectTimer;
  var _closed = false;
  var _authenticated = false;
  var _hasInitialSnapshot = false;
  var _eventId = 0;
  var _conversationUuids = <String>[];
  int _unreadCount = 0;

  int get unreadCount => _unreadCount;

  void updateSession(UserSession updatedSession) {
    if (session.accessToken == updatedSession.accessToken) return;
    session = updatedSession;
    _authenticated = false;
    _reconnectTimer?.cancel();
    _channel?.sink.close();
    _channel = null;
    unawaited(refresh());
    unawaited(_connect());
  }

  Future<void> start() async {
    await refresh();
    _poller = Timer.periodic(
      const Duration(seconds: 20),
      (_) => unawaited(refresh()),
    );
    await _connect();
  }

  Future<void> refresh() async {
    try {
      final conversations = await api.conversations(
        accessToken: session.accessToken,
        currentEmail: session.profile.email,
      );
      _conversationUuids =
          conversations.map((item) => item.channelIdentifier).toList();
      final count = conversations.fold<int>(
        0,
        (total, item) => total + item.unreadCount,
      );
      if (_unreadCount != count) {
        final hasNewMessages = _hasInitialSnapshot && count > _unreadCount;
        _unreadCount = count;
        notifyListeners();
        if (hasNewMessages) onNewUnreadMessages?.call(count);
      }
      _hasInitialSnapshot = true;
      if (_authenticated) _subscribeToConversations();
    } on Exception {
      // Keep the last confirmed count until the API becomes available again.
    }
  }

  Future<void> _connect() async {
    if (_closed) return;
    try {
      final channel = WebSocketChannel.connect(_webSocketUri(session));
      _channel = channel;
      await channel.ready;
      _authenticated = true;
      channel.stream.listen(
        _receive,
        onDone: _reconnect,
        onError: (_) => _reconnect(),
        cancelOnError: true,
      );
      _subscribeToConversations();
    } catch (_) {
      _reconnect();
    }
  }

  void _receive(Object? raw) {
    final envelope = _decode(raw);
    if (envelope == null) return;
    final eventType = envelope['eventType'];
    if (eventType == 'message.created' ||
        eventType == 'message.updated' ||
        eventType == 'message.deleted') {
      unawaited(refresh());
    }
  }

  void _subscribeToConversations() {
    for (final channelUuid in _conversationUuids) {
      _send('chat.subscribe', {'channelUuid': channelUuid});
    }
  }

  void _send(String eventType, Map<String, Object> payload) {
    _eventId += 1;
    _channel?.sink.add(
      jsonEncode({
        'eventId': 'mobile-$_eventId',
        'eventType': eventType,
        'payload': payload,
      }),
    );
  }

  void _reconnect() {
    if (_closed || _reconnectTimer?.isActive == true) return;
    _authenticated = false;
    _channel = null;
    _reconnectTimer = Timer(const Duration(seconds: 2), _connect);
  }

  @override
  void dispose() {
    _closed = true;
    _poller?.cancel();
    _reconnectTimer?.cancel();
    unawaited(_channel?.sink.close());
    super.dispose();
  }
}

Uri _webSocketUri(UserSession session) {
  final api = Uri.parse(AppConfig.apiUrl);
  return api.replace(
    scheme: api.scheme == 'https' ? 'wss' : 'ws',
    path: '${api.path.replaceFirst(RegExp(r'/$'), '')}/chat/realtime',
    queryParameters: {
      'token': session.accessToken,
      'companyId': '1',
    },
  );
}

Map<String, dynamic>? _decode(Object? raw) {
  if (raw is! String) return null;
  try {
    return jsonDecode(raw) as Map<String, dynamic>;
  } on FormatException {
    return null;
  }
}
