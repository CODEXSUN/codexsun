class AppConfig {
  const AppConfig._();

  static const brandName = String.fromEnvironment(
    'APP_BRAND',
    defaultValue: 'CRM',
  );

  static const appVersion = String.fromEnvironment('APP_VERSION');

  static const apiUrl = String.fromEnvironment(
    'API_URL',
    defaultValue: 'http://127.0.0.1:7010',
  );

  static const corporateId = String.fromEnvironment('CORPORATE_ID');

  static const releaseManifestUrl = String.fromEnvironment(
    'RELEASE_MANIFEST_URL',
  );

  static const nativeChannelPrefix = String.fromEnvironment(
    'NATIVE_CHANNEL_PREFIX',
    defaultValue: 'in.codexsun.crm_app',
  );

  static const releaseFilePrefix = String.fromEnvironment(
    'RELEASE_FILE_PREFIX',
  );

  static const logoAsset = String.fromEnvironment(
    'APP_LOGO_ASSET',
    defaultValue: 'assets/crm-logo.png',
  );
}
