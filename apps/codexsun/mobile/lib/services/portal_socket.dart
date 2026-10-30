import 'dart:math';
import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;

import 'portal_api.dart';
import 'native_socket.dart';

String requestKey() {
  final random = Random.secure();
  return List.generate(
    16,
    (_) => random.nextInt(256),
  ).map((v) => v.toRadixString(16).padLeft(2, '0')).join();
}

class PortalSocket extends ChangeNotifier {
  PortalSocket(this.api, this.onChanged);
  final PortalApi api;
  final VoidCallback onChanged;
  io.Socket? _socket;
  Timer? _ackTimer;
  bool _disposed = false;
  int _sequence = 0;
  String status = 'Disconnected';
  String acknowledgement = '';
  final List<String> messages = [];
  bool get connected => _socket?.connected == true;
  void connect() {
    _socket?.dispose();
    final url = Uri.parse(api.baseUrl);
    final prefix = url.path.replaceAll(RegExp(r'/$'), '');
    final socket = io.io(
      url.origin,
      io.OptionBuilder()
          .setTransports(['websocket'])
          .disableAutoConnect()
          .enableForceNew()
          .setPath('$prefix/codexsun/socket.io')
          .setAuth({'sessionSlot': api.sessionSlot, 'portal': 'mobile'})
          .setExtraHeaders({'Cookie': api.cookie})
          .build()
        ..['webSocketConnector'] = connectPortalWebSocket,
    );
    _socket = socket;
    status = 'Connecting…';
    socket.onConnect((_) {
      status = 'Live connected';
      notifyListeners();
      onChanged();
    });
    socket.onDisconnect((_) {
      status = 'Disconnected';
      notifyListeners();
    });
    socket.onConnectError((_) {
      status = 'Connection unavailable. Sign in or retry.';
      notifyListeners();
    });
    socket.on('codexsun:changed', (value) {
      if (value is Map &&
          ['requirements', 'devices'].contains(value['resource'])) {
        onChanged();
      }
    });
    socket.on('codexsun:signal', (value) {
      if (value is! Map ||
          value['text'] is! String ||
          value['sourcePortal'] is! String) {
        return;
      }
      messages.add('${value['sourcePortal']}: ${value['text']}');
      if (messages.length > 5) messages.removeAt(0);
      notifyListeners();
    });
    socket.connect();
  }

  void ping() => _send('codexsun:ping', {'nonce': requestKey()});
  void signal(String text) {
    final value = text.trim();
    if (value.isEmpty || value.length > 240) return;
    _send('codexsun:signal', {'nonce': requestKey(), 'text': value});
  }

  void _send(String event, Map<String, dynamic> value) {
    if (!connected) return;
    final sequence = ++_sequence;
    _ackTimer?.cancel();
    _ackTimer = Timer(const Duration(seconds: 5), () {
      acknowledgement = 'Server did not acknowledge. Retry after reconnecting.';
      notifyListeners();
    });
    _socket!.emitWithAck(
      event,
      value,
      ack: (response) {
        if (_disposed || sequence != _sequence) return;
        _ackTimer?.cancel();
        acknowledgement =
            response is Map &&
                response['serverTime'] is String &&
                response['nonce'] == value['nonce']
            ? 'Server acknowledged'
            : 'Server refused the message.';
        notifyListeners();
      },
    );
  }

  @override
  void dispose() {
    _disposed = true;
    _ackTimer?.cancel();
    _socket?.dispose();
    super.dispose();
  }
}
