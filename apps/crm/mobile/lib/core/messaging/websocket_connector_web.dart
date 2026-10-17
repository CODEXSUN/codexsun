import 'package:web_socket_channel/web_socket_channel.dart';

WebSocketChannel connectMessagingSocket(Uri uri, {String? hostHeader}) =>
    WebSocketChannel.connect(uri);
