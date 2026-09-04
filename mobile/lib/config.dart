class AppConfig {
  static const String baseUrl = String.fromEnvironment(
    'MZDATA_API_BASE',
    defaultValue: 'https://mzdata-1.onrender.com/api/v1',
  );
}
