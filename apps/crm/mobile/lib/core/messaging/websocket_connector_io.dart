import 'package:web_socket_channel/io.dart';
import 'package:web_socket_channel/web_socket_channel.dart';

WebSocketChannel connectMessagingSocket(Uri uri, {String? hostHeader}) =>
    IOWebSocketChannel.connect(
      uri,
      headers: hostHeader == null ? null : {'Host': hostHeader},
    );
