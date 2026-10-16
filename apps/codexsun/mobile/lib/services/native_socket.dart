import 'dart:io' as native;
import 'dart:typed_data';

import 'package:web_socket/io_web_socket.dart';
import 'package:web_socket/web_socket.dart' as ws;

Future<ws.WebSocket> connectPortalWebSocket(
  Uri uri, {
  Iterable<String>? protocols,
  Map<String, String>? headers,
}) async {
  final socket = await native.WebSocket.connect(
    uri.toString(),
    protocols: protocols,
    headers: headers,
  );
  return _PortalWebSocket(IOWebSocket.fromWebSocket(socket));
}

class _PortalWebSocket implements ws.WebSocket {
  _PortalWebSocket(this.socket);
  final ws.WebSocket socket;
  @override
  Stream<ws.WebSocketEvent> get events => socket.events;
  @override
  String get protocol => socket.protocol;
  @override
  void sendText(String text) => socket.sendText(text);
  @override
  void sendBytes(Uint8List bytes) => socket.sendBytes(bytes);
  @override
  Future<void> close([int? code, String? reason]) async {
    try {
      await socket.close(code, reason);
    } on ws.WebSocketConnectionClosed {
      // Socket.IO can close again after the peer already closed the transport.
    }
  }
}
