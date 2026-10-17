class AppConfig {
  static const String baseUrl = String.fromEnvironment(
    'MZDATA_API_BASE',
    defaultValue: 'https://api.mzdata.org/api/v1',
  );
}
