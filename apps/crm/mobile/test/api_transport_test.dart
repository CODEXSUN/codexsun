import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:codexsun_crm_mobile/core/api/crm_mobile_api.dart';

void main() {
  late HttpServer server;
  late String responseBody;
  late int responseStatus;

  setUp(() async {
    responseBody = '{"success":true,"data":{"status":"ok"}}';
    responseStatus = HttpStatus.ok;
    server = await HttpServer.bind(InternetAddress.loopbackIPv4, 0);
    server.listen((request) async {
      request.response
        ..statusCode = responseStatus
        ..headers.contentType = ContentType.json
        ..write(responseBody);
      await request.response.close();
    });
  });

  tearDown(() async {
    await server.close(force: true);
  });

  CrmMobileApi apiForServer() =>
      CrmMobileApi('http://${server.address.address}:${server.port}');

  test('parses a valid CRM envelope', () async {
    final health = await apiForServer().health();

    expect(health.isHealthy, isTrue);
  });

  test('converts non-JSON error pages into a CRM API error', () async {
    responseStatus = HttpStatus.badGateway;
    responseBody = '<html>upstream unavailable</html>';

    await expectLater(
      apiForServer().health(),
      throwsA(
        isA<CrmMobileApiException>().having(
          (error) => error.message,
          'message',
          'The server returned an invalid response. Try again.',
        ),
      ),
    );
  });

  test('converts invalid JSON envelopes into a CRM API error', () async {
    responseBody = '[]';

    await expectLater(
      apiForServer().health(),
      throwsA(isA<CrmMobileApiException>()),
    );
  });

  test('converts connection failures into a CRM API error', () async {
    final api = CrmMobileApi('http://127.0.0.1:1');

    await expectLater(
      api.health(),
      throwsA(
        isA<CrmMobileApiException>().having(
          (error) => error.message,
          'message',
          'Could not connect to CRM. Check your connection and try again.',
        ),
      ),
    );
  });
}
