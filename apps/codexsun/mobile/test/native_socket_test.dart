import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:web_socket/web_socket.dart' as ws;
import 'package:codexsun_mobile/services/native_socket.dart';

void main() {
  test('server closure followed by Socket.IO cleanup is safe', () async {
    final server = await HttpServer.bind(InternetAddress.loopbackIPv4, 0);
    final peer = server.first.then(WebSocketTransformer.upgrade);
    final socket = await connectPortalWebSocket(
      Uri.parse('ws://127.0.0.1:${server.port}'),
    );
    final closed = socket.events.firstWhere(
      (event) => event is ws.CloseReceived,
    );
    await (await peer).close();
    await closed;
    await socket.close();
    await socket.close();
    await server.close(force: true);
  });
}
