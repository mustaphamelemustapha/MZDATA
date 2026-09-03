class AppConfig {
  static const String baseUrl = String.fromEnvironment(
    'MZDATA_API_BASE',
    defaultValue: 'https://client-vtu-api.onrender.com/api/v1',
  );
}
