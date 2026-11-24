import '../config.dart';
import 'api_client.dart';

class PasswordService {
  ApiClient get _client => ApiClient(baseUrl: AppConfig.baseUrl);

  static const Duration _resetTimeout = Duration(seconds: 30);

  Future<Map<String, dynamic>> requestReset(String identifier) async {
    return _client.post(
      '/auth/forgot-password',
      {'identifier': identifier.trim()},
      timeout: _resetTimeout,
    );
  }

  Future<Map<String, dynamic>> verifyResetToken({
    required String identifier,
    required String otp,
  }) async {
    return _client.post(
      '/auth/verify-reset-token',
      {
        'identifier': identifier.trim(),
        'otp': otp.trim(),
      },
      timeout: _resetTimeout,
    );
  }

  Future<Map<String, dynamic>> resetPassword({
    required String identifier,
    required String otp,
    required String newPassword,
  }) async {
    return _client.post(
      '/auth/reset-password',
      {
        'identifier': identifier.trim(),
        'otp': otp.trim(),
        'new_password': newPassword,
      },
      timeout: _resetTimeout,
    );
  }
}
