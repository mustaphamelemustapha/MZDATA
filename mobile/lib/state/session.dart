import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../services/auth_service.dart';
import '../services/api_client.dart';
import '../services/biometric_service.dart';
import '../services/push_notification_service.dart';
import '../services/config_service.dart';
import '../config.dart';
import 'package:package_info_plus/package_info_plus.dart';

class SessionController extends ChangeNotifier {
  SessionController() {
    ApiClient.onUnauthorizedError.stream.listen((_) {
      if (isAuthenticated && !_isLocked) {
        debugPrint('[Session] Global 401 intercepted. Locking session.');
        lockForcefully();
      }
    });
  }
  static const String _tokenKey = 'axisvtu_secure_token_v1';
  static const String _biometricTokenKey = 'axisvtu_biometric_token_v1';
  static const String _biometricUserKey = 'axisvtu_biometric_user';
  static const String _biometricPasswordKey = 'axisvtu_biometric_password';
  static const String _securityPrefKey = 'axisvtu_security_preference_v1';
  static const String _lastUserJsonKey = 'axisvtu_last_user_v1';
  static const String lastIdentifierKey = 'axisvtu_last_identifier_v1';
  
  static const _secureStorage = FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
    iOptions: IOSOptions(accessibility: KeychainAccessibility.first_unlock),
  );

  String? _token;
  Map<String, dynamic>? _user;
  Map<String, dynamic>? _lastUser;
  String? _lastPassword;
  bool _loading = false;
  String? _error;
  bool _bootstrapped = false;
  
  bool _updateRequired = false;
  bool _optionalUpdateAvailable = false;
  String _latestAppVersion = '1.0.0';
  String _playStoreUrl = '';
  String _appStoreUrl = '';
  bool _maintenanceMode = false;
  String _maintenanceMessage = '';
  String _releaseNotes = '';
  String _supportPhone = '';
  String _supportWhatsApp = '';

  String? get token => _token;
  Map<String, dynamic>? get user => _user;
  Map<String, dynamic>? get lastUser => _lastUser;
  bool get isLoading => _loading;
  String? get error => _error;
  bool get isBootstrapped => _bootstrapped;
  bool get updateRequired => _updateRequired;
  bool get optionalUpdateAvailable => _optionalUpdateAvailable;
  String get latestAppVersion => _latestAppVersion;
  String get playStoreUrl => _playStoreUrl;
  String get appStoreUrl => _appStoreUrl;
  bool get maintenanceMode => _maintenanceMode;
  String get maintenanceMessage => _maintenanceMessage;
  String get releaseNotes => _releaseNotes;
  String get supportPhone => _supportPhone;
  String get supportWhatsApp => _supportWhatsApp;
  bool get isAuthenticated => _token != null && _token!.isNotEmpty;
  bool get isAdmin {
    final role = (_user?['role'] ?? '').toString().toLowerCase();
    return role == 'admin' || role == 'superadmin';
  }

  static const String _devStatusJsonKey = 'axisvtu_dev_status_v1';
  Map<String, dynamic>? _developerStatus;
  Map<String, dynamic>? get developerStatus => _developerStatus;

  bool get isDeveloper {
    final role = (_user?['role'] ?? '').toString().toLowerCase();
    if (role == 'developer') return true;

    // Check status fetched from /developer/status (active API keys generated via web portal)
    final bool devHasKeys = _developerStatus?['has_keys'] == true ||
        (_developerStatus?['api_public_key'] != null && _developerStatus!['api_public_key'].toString().trim().isNotEmpty);
    final String devStat = (_developerStatus?['developer_status'] ?? '').toString().toLowerCase();
    final bool devFlag = _developerStatus?['is_developer'] == true;
    if (devHasKeys && (devFlag || devStat == 'approved')) return true;

    // Check status from /auth/me user object
    final isDev = _user?['is_developer'];
    final bool userIsDev = isDev == true || isDev == 1 || isDev == 'true';
    final status = (_user?['developer_status'] ?? '').toString().toLowerCase();
    final bool userHasKeys = _user?['has_api_keys'] == true ||
        (_user?['api_public_key'] != null && _user!['api_public_key'].toString().trim().isNotEmpty);

    return userHasKeys && (userIsDev || status == 'approved');
  }

  bool get isAgent {
    final isAg = _user?['is_agent'];
    if (isAg == true || isAg == 1 || isAg == 'true') return true;
    final role = (_user?['role'] ?? '').toString().toLowerCase();
    return role == 'agent' || role == 'reseller' || role == 'ambassador';
  }

  Future<void> refreshDeveloperStatus() async {
    if (_token == null || _token!.isEmpty) return;
    try {
      final res = await ApiClient(baseUrl: AppConfig.baseUrl, token: _token!).get('/developer/status', forceRefresh: true);
      if (res['detail'] == null && res['status'] != false) {
        _developerStatus = res;
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString(_devStatusJsonKey, jsonEncode(res));
        notifyListeners();
      }
    } catch (_) {
      // Silently ignore if developer endpoint is inactive or user has not applied
    }
  }

  String? _securityPreference;
  String? get securityPreference => _securityPreference;
  bool get hasSecurityPreference => _securityPreference != null;

  int _balanceRefreshTick = 0;
  int get balanceRefreshTick => _balanceRefreshTick;

  void refreshBalance() {
    _balanceRefreshTick++;
    ApiClient.invalidate('/transactions/me');
    ApiClient.invalidate('/wallet/me');
    refreshDeveloperStatus();
    notifyListeners();
  }

  String _getUserPrefKey(String? identifier) {
    if (identifier == null || identifier.trim().isEmpty) {
      return _securityPrefKey;
    }
    final sanitized = identifier.trim().toLowerCase().replaceAll(RegExp(r'[^a-zA-Z0-9]'), '_');
    return 'axisvtu_security_preference_v1_$sanitized';
  }

  bool _isLocked = false;
  bool get isLocked => _isLocked;

  void lock() {
    if (_securityPreference == 'max') {
      _isLocked = true;
      notifyListeners();
    }
  }

  void lockForcefully() {
    _isLocked = true;
    notifyListeners();
  }

  void unlock() {
    _isLocked = false;
    notifyListeners();
  }

  Map<String, dynamic>? _asMap(dynamic value) {
    if (value is Map<String, dynamic>) return value;
    return null;
  }

  String? _extractToken(Map<String, dynamic> data) {
    return data['access_token'] ??
        data['token'] ??
        _asMap(data['data'])?['access_token'] ??
        _asMap(data['data'])?['token'];
  }

  Map<String, dynamic>? _extractUser(Map<String, dynamic> data) {
    return _asMap(data['user']) ?? _asMap(_asMap(data['data'])?['user']);
  }

  bool _hasMeaningfulProfile(Map<String, dynamic>? user) {
    if (user == null || user.isEmpty) return false;
    final fullName = (user['full_name'] ?? user['name'] ?? '')
        .toString()
        .trim();
    final email = (user['email'] ?? '').toString().trim();
    return fullName.isNotEmpty || email.isNotEmpty;
  }

  Future<Map<String, dynamic>?> _fetchMe(String token) async {
    try {
      final data = await AuthService(token: token).me();
      return _asMap(data['user']) ?? data;
    } on ApiException catch (e) {
      if (e.statusCode == 401 || e.statusCode == 403) {
        rethrow; // Definitive auth failure
      }
      rethrow; // Propagate network/server errors
    } catch (e) {
      rethrow;
    }
  }

  bool _isVersionOutdated(String current, String minimum) {
    try {
      final v1 = current.split('.').map(int.parse).toList();
      final v2 = minimum.split('.').map(int.parse).toList();
      for (var i = 0; i < v1.length && i < v2.length; i++) {
        if (v1[i] < v2[i]) return true;
        if (v1[i] > v2[i]) return false;
      }
      return v1.length < v2.length;
    } catch (e) {
      return false; // If parsing fails, don't force update to be safe
    }
  }

  Future<void> bootstrap() async {
    if (_bootstrapped && isAuthenticated && !_updateRequired) return;
    
    try {
      // 1. Load security preference and cached profile locally FIRST (sub-millisecond)
      final prefs = await SharedPreferences.getInstance();
      final identifier = prefs.getString(lastIdentifierKey) ?? prefs.getString('mzdata_last_identifier') ?? prefs.getString('axisvtu_last_identifier_v1');
      await prefs.remove('axisvtu_developer_mode_v1');
      final cachedDevJson = prefs.getString(_devStatusJsonKey);
      if (cachedDevJson != null && cachedDevJson.isNotEmpty) {
        try {
          _developerStatus = jsonDecode(cachedDevJson) as Map<String, dynamic>;
        } catch (_) {}
      }
      
      final lastUserJson = prefs.getString(_lastUserJsonKey) ?? prefs.getString('mzdata_last_user_v1');
      if (lastUserJson != null && lastUserJson.isNotEmpty) {
        try {
          _lastUser = jsonDecode(lastUserJson) as Map<String, dynamic>;
          
          // Invalidate legacy cached profiles that contain "KullomaData" or "Axis" in the name
          final nameStr = (_lastUser?['full_name'] ?? _lastUser?['name'] ?? '').toString().toLowerCase();
          if (nameStr.contains('axisvtu') || nameStr.contains('axis vtu') || nameStr.trim() == 'axis') {
            _lastUser = null;
            await prefs.remove(_lastUserJsonKey);
          }
          
          // Establish temporary offline profile fallback to prevent empty state UI on boot
          if (_user == null && _lastUser != null) {
            _user = _lastUser;
          }
        } catch (_) {}
      }

      // 2. Load security preference locally (default to 'smart' so users aren't locked on every brief pause)
      final userIdent = identifier ??
          _lastUser?['email']?.toString() ??
          _lastUser?['phone_number']?.toString() ??
          _lastUser?['phone']?.toString();
      _securityPreference = (userIdent != null && userIdent.trim().isNotEmpty)
          ? (prefs.getString(_getUserPrefKey(userIdent.trim())) ?? prefs.getString(_securityPrefKey))
          : prefs.getString(_securityPrefKey);

      _securityPreference ??= 'smart';

      // 3. Read stored secure token locally
      try {
        _token = await _secureStorage.read(key: _tokenKey) ?? await _secureStorage.read(key: 'mzdata_secure_token_v1');
      } catch (e) {
        debugPrint('[Session] Secure storage read failed: $e');
        _token = null;
      }
      
      if (_token != null && _token!.isNotEmpty && _securityPreference == 'max') {
        _isLocked = true;
      }
    } catch (e) {
      debugPrint('[Session] Local bootstrap failed: $e');
    } finally {
      // Mark bootstrapped immediately so the splash screen transitions instantly
      _bootstrapped = true;
      notifyListeners();
      
      // 3. Trigger network checks asynchronously in the background
      _bootstrapNetworkTasks();
    }
  }

  Future<void> _bootstrapNetworkTasks() async {
    // A. Fetch config and check app version in the background
    try {
      final config = await ConfigService.fetchAppConfig();
      _playStoreUrl = config['play_store_url'] ?? '';
      _appStoreUrl = config['app_store_url'] ?? '';
      _maintenanceMode = config['maintenance_mode'] == true;
      _maintenanceMessage = (config['maintenance_message'] ?? '').toString();
      _releaseNotes = (config['release_notes'] ?? '').toString();
      _supportPhone = (config['support_phone'] ?? '').toString();
      _supportWhatsApp = (config['support_whatsapp'] ?? '').toString();
      
      final packageInfo = await PackageInfo.fromPlatform();
      final currentVersion = packageInfo.version;

      final minVersionStr = config['min_app_version'] as String?;
      if (minVersionStr != null && minVersionStr.isNotEmpty) {
        final isOutdated = _isVersionOutdated(currentVersion, minVersionStr);
        if (isOutdated != _updateRequired) {
          _updateRequired = isOutdated;
          notifyListeners();
        }
      }

      final latestVersionStr = config['latest_app_version'] as String?;
      if (latestVersionStr != null && latestVersionStr.isNotEmpty) {
        _latestAppVersion = latestVersionStr;
        final isOptionalOutdated = _isVersionOutdated(currentVersion, latestVersionStr);
        if (isOptionalOutdated != _optionalUpdateAvailable) {
          _optionalUpdateAvailable = isOptionalOutdated;
          notifyListeners();
        }
      }
    } catch (e) {
      debugPrint('[Session] Failed to fetch app config: $e');
    }

    // B. Verify and update profile details in the background if token exists
    if (_token != null && _token!.isNotEmpty) {
      try {
        final fetched = await _fetchMe(_token!);
        if (fetched != null) {
          _user = fetched;
          _lastUser = fetched;
          
          final prefs = await SharedPreferences.getInstance();
          await prefs.setString(_lastUserJsonKey, jsonEncode(fetched));
          notifyListeners();
        }
      } catch (e) {
        debugPrint('[Session] Background profile fetch failed: $e');
        if (e is ApiException && (e.statusCode == 401 || e.statusCode == 403)) {
          // Session expired: Lock app locally and display lock screen
          _isLocked = true;
          notifyListeners();
        }
      }

      await refreshDeveloperStatus();
    }
    
    // C. Initialize Push Notifications in the background
    try {
      PushNotificationService.initialize(this);
    } catch (e) {
      debugPrint('[Session] Failed to initialize push notifications: $e');
    }
  }

  Future<bool> login(String email, String password) async {
    _setLoading(true);
    try {
      final data = await AuthService().login(email: email, password: password);
      _token = _extractToken(data);
      _user = _extractUser(data);
      if (_token == null || _token!.isEmpty) {
        throw Exception('Login failed. Missing token.');
      }
      _lastPassword = password;
      if (!_hasMeaningfulProfile(_user)) {
        final fresh = await _fetchMe(_token!);
        if (fresh != null) _user = fresh;
      }
      
      await _secureStorage.write(key: _tokenKey, value: _token!);
      
      // Always automatically save and enable biometric credentials on successful login.
      try {
        final prefs = await SharedPreferences.getInstance();
        await prefs.setBool('app_biometric_lock', true);
        
        await _secureStorage.write(key: _biometricTokenKey, value: _token!);
        final trimmedIdentifier = email.trim();
        if (trimmedIdentifier.isNotEmpty) {
          await _secureStorage.write(key: _biometricUserKey, value: trimmedIdentifier);
        }
        if (_lastPassword != null && _lastPassword!.isNotEmpty) {
          await _secureStorage.write(key: _biometricPasswordKey, value: _lastPassword!);
        }
        debugPrint('[Session] Automatically enabled biometrics for logged in user.');
      } catch (e) {
        debugPrint('[Session] Failed to auto-enable biometrics on login: $e');
      }
      
      final prefs = await SharedPreferences.getInstance();
      final trimmedIdentifier = email.trim();
      if (trimmedIdentifier.isNotEmpty) {
        await prefs.setString(lastIdentifierKey, trimmedIdentifier);
      }
      _securityPreference = prefs.getString(_getUserPrefKey(trimmedIdentifier));
      _isLocked = _token != null && _token!.isNotEmpty && _securityPreference == 'max';
      if (_user != null) {
        _lastUser = _user;
        await prefs.setString(_lastUserJsonKey, jsonEncode(_user));
      }
      _setError(null);
      notifyListeners();
      
      // Sync token upon fresh login
      PushNotificationService.initialize(this);
      
      return true;
    } catch (e) {
      _setError(_friendlyError(e));
      return false;
    } finally {
      _setLoading(false);
    }
  }

  Future<bool> register(
    String name,
    String email,
    String phone,
    String password,
    {String? referralCode, String? state, String? pin}
  ) async {
    _setLoading(true);
    try {
      final normalizedEmail = email.trim();
      final data = await AuthService().register(
        fullName: name,
        email: normalizedEmail,
        phone: phone,
        password: password,
        referralCode: referralCode,
        state: state,
        pin: pin,
      );
      _token = _extractToken(data);
      _user = _extractUser(data);

      if (_token == null || _token!.isEmpty) {
        final loginData = await AuthService().login(
          email: normalizedEmail,
          password: password,
        );
        _token = _extractToken(loginData);
        _user = _extractUser(loginData) ?? _user;
      }
      if (_token == null || _token!.isEmpty) {
        throw Exception(
          'Registration completed, but automatic sign-in failed. Please login now.',
        );
      }
      _lastPassword = password;
      if (!_hasMeaningfulProfile(_user)) {
        final fresh = await _fetchMe(_token!);
        if (fresh != null) _user = fresh;
      }
      if (state != null && state.trim().isNotEmpty) {
        final current = _user != null ? Map<String, dynamic>.from(_user!) : <String, dynamic>{};
        if (current['state'] == null || current['state'].toString().trim().isEmpty) {
          current['state'] = state.trim();
          _user = current;
        }
      }

      await _secureStorage.write(key: _tokenKey, value: _token!);

      // Always automatically save and enable biometric credentials on successful registration.
      try {
        final prefs = await SharedPreferences.getInstance();
        await prefs.setBool('app_biometric_lock', true);
        
        await _secureStorage.write(key: _biometricTokenKey, value: _token!);
        final preferredIdentifier = normalizedEmail.isNotEmpty ? normalizedEmail : phone.trim();
        if (preferredIdentifier.isNotEmpty) {
          await _secureStorage.write(key: _biometricUserKey, value: preferredIdentifier);
        }
        if (_lastPassword != null && _lastPassword!.isNotEmpty) {
          await _secureStorage.write(key: _biometricPasswordKey, value: _lastPassword!);
        }
        debugPrint('[Session] Automatically enabled biometrics for registered user.');
      } catch (e) {
        debugPrint('[Session] Failed to auto-enable biometrics on registration: $e');
      }

      final prefs = await SharedPreferences.getInstance();
      final preferredIdentifier = normalizedEmail.isNotEmpty
          ? normalizedEmail
          : phone.trim();
      if (preferredIdentifier.isNotEmpty) {
        await prefs.setString(lastIdentifierKey, preferredIdentifier);
      }
      _securityPreference = prefs.getString(_getUserPrefKey(preferredIdentifier));
      _isLocked = _token != null && _token!.isNotEmpty && _securityPreference == 'max';
      if (_user != null) {
        _lastUser = _user;
        await prefs.setString(_lastUserJsonKey, jsonEncode(_user));
      }
      _setError(null);
      notifyListeners();
      return true;
    } catch (e) {
      _setError(_friendlyError(e));
      return false;
    } finally {
      _setLoading(false);
    }
  }

  Future<void> logout() async {
    try {
      await _secureStorage.delete(key: _tokenKey);
      final prefs = await SharedPreferences.getInstance();
      final identifier = prefs.getString(lastIdentifierKey) ?? prefs.getString('mzdata_last_identifier') ?? prefs.getString('axisvtu_last_identifier_v1');
      await prefs.remove(_getUserPrefKey(identifier));
      await prefs.remove(_devStatusJsonKey);
      // Clear any stored transaction PIN for the logged‑out user
      await BiometricService.deletePin();
    } catch (e) {
      debugPrint('[Session] Secure storage/SharedPreferences delete failed: $e');
    }
    _token = null;
    _user = null;
    _developerStatus = null;
    _securityPreference = null;
    _isLocked = false;
    await ApiClient.clearCache();
    notifyListeners();
  }

  Future<void> clearLastUser() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_lastUserJsonKey);
      await prefs.remove(lastIdentifierKey);
      await disableBiometrics();
      // Also clear any stored transaction PIN for the previous user
      await BiometricService.deletePin();
    } catch (_) {}
    _lastUser = null;
    await ApiClient.clearCache();
    notifyListeners();
  }

  Future<void> setSecurityPreference(String pref) async {
    _securityPreference = pref;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_securityPrefKey, pref);
    final userIdent = _user?['email']?.toString() ??
        _user?['phone_number']?.toString() ??
        _user?['phone']?.toString() ??
        _lastUser?['email']?.toString() ??
        _lastUser?['phone_number']?.toString() ??
        _lastUser?['phone']?.toString();
    final identifier = prefs.getString(lastIdentifierKey) ?? userIdent;
    if (identifier != null && identifier.trim().isNotEmpty) {
      await prefs.setString(lastIdentifierKey, identifier.trim());
      await prefs.setString(_getUserPrefKey(identifier.trim()), pref);
    }
    notifyListeners();
  }

  /// Saves the current session token specifically for biometric quick-login.
  Future<void> enableBiometrics() async {
    if (_token == null || _token!.isEmpty) return;
    try {
      await _secureStorage.write(key: _biometricTokenKey, value: _token!);
      final prefs = await SharedPreferences.getInstance();
      final identifier = prefs.getString(lastIdentifierKey) ?? '';
      if (identifier.isNotEmpty) {
        await _secureStorage.write(key: _biometricUserKey, value: identifier);
      }
      if (_lastPassword != null && _lastPassword!.isNotEmpty) {
        await _secureStorage.write(key: _biometricPasswordKey, value: _lastPassword!);
      }
      debugPrint('[Session] Biometric token and credentials saved.');
    } catch (e) {
      debugPrint('[Session] Failed to save biometric token/credentials: $e');
    }
  }

  /// Removes any saved biometric quick-login credentials.
  Future<void> disableBiometrics() async {
    try {
      await _secureStorage.delete(key: _biometricTokenKey);
      await _secureStorage.delete(key: _biometricUserKey);
      await _secureStorage.delete(key: _biometricPasswordKey);
      debugPrint('[Session] Biometric credentials deleted.');
    } catch (e) {
      debugPrint('[Session] Failed to delete biometric credentials: $e');
    }
  }

  /// Compares two user identifiers (phone or email) flexibly
  static bool isSameUser(String? a, String? b) {
    if (a == null || b == null) return false;
    final cleanA = a.trim().toLowerCase();
    final cleanB = b.trim().toLowerCase();
    if (cleanA.isEmpty || cleanB.isEmpty) return false;
    if (cleanA == cleanB) return true;

    // Email check
    if (cleanA.contains('@') || cleanB.contains('@')) {
      return cleanA == cleanB;
    }

    // Phone digits comparison (strip country codes, leading zeros, dashes)
    final digitsA = cleanA.replaceAll(RegExp(r'\D'), '');
    final digitsB = cleanB.replaceAll(RegExp(r'\D'), '');
    if (digitsA.isEmpty || digitsB.isEmpty) return false;

    final last10A = digitsA.length >= 10 ? digitsA.substring(digitsA.length - 10) : digitsA;
    final last10B = digitsB.length >= 10 ? digitsB.substring(digitsB.length - 10) : digitsB;
    return last10A == last10B;
  }

  /// Returns the saved identifier for biometric quick-login, if any.
  Future<String?> getBiometricUser() async {
    try {
      return await _secureStorage.read(key: _biometricUserKey) ?? await _secureStorage.read(key: 'mzdata_biometric_user');
    } catch (_) {
      return null;
    }
  }

  /// Checks if stored biometric credentials belong to this specific user identifier.
  Future<bool> hasBiometricsFor(String? identifier) async {
    if (identifier == null || identifier.trim().isEmpty) return false;
    final savedUser = await getBiometricUser();
    if (savedUser == null || savedUser.isEmpty) return false;
    return isSameUser(savedUser, identifier);
  }

  /// Attempts to restore the session using the saved biometric token or credentials.
  /// If [targetIdentifier] is provided, it guarantees that biometric login only logs into that user.
  Future<bool> loginWithBiometrics({String? targetIdentifier}) async {
    try {
      final savedUser = await _secureStorage.read(key: _biometricUserKey) ?? await _secureStorage.read(key: 'mzdata_biometric_user');

      // CRITICAL: If a specific target identifier was requested, verify that the saved
      // credentials actually match this account. Never log a user into someone else's account!
      if (targetIdentifier != null && targetIdentifier.trim().isNotEmpty) {
        if (savedUser == null || !isSameUser(savedUser, targetIdentifier)) {
          debugPrint('[Session] loginWithBiometrics rejected: target ($targetIdentifier) != saved ($savedUser)');
          return false;
        }
      }

      final bioToken = await _secureStorage.read(key: _biometricTokenKey) ?? await _secureStorage.read(key: 'mzdata_biometric_token_v1');
      if (bioToken == null || bioToken.isEmpty) {
        debugPrint('[Session] No biometric token found.');
        return false;
      }

      // Try the session token first
      try {
        final user = await _fetchMe(bioToken);
        if (user != null) {
          // Double-check fetched profile against targetIdentifier
          if (targetIdentifier != null && targetIdentifier.trim().isNotEmpty) {
            final fetchedPhone = user['phone_number'] ?? user['phone'] ?? user['email'];
            if (fetchedPhone != null && !isSameUser(fetchedPhone.toString(), targetIdentifier)) {
              debugPrint('[Session] Token belonged to different user. Aborting biometric restore.');
              return false;
            }
          }
          _token = bioToken;
          _user = user;
          await _secureStorage.write(key: _tokenKey, value: _token!);
          _setError(null);
          notifyListeners();
          return true;
        }
      } catch (e) {
        debugPrint('[Session] Biometric token fetch failed: $e. Trying stored credentials.');
      }

      // If token failed/expired, try to perform a full re-login using securely stored credentials!
      final savedPass = await _secureStorage.read(key: _biometricPasswordKey) ?? await _secureStorage.read(key: 'mzdata_biometric_password');

      if (savedUser != null && savedUser.isNotEmpty && savedPass != null && savedPass.isNotEmpty) {
        debugPrint('[Session] Re-authenticating with saved biometric credentials.');
        final loginSuccess = await _loginSilent(savedUser, savedPass);
        if (loginSuccess) {
          return true;
        }
      }

      // If both token and credentials fail, keep keys intact for settings toggle
      debugPrint('[Session] Biometric login failed. Kept credentials intact.');
      _token = null;
      return false;
    } catch (e) {
      debugPrint('[Session] loginWithBiometrics unexpected error: $e');
      _token = null;
      return false;
    }
  }

  Future<bool> _loginSilent(String identifier, String password) async {
    try {
      final data = await AuthService().login(email: identifier, password: password);
      final newToken = _extractToken(data);
      final newUser = _extractUser(data);

      if (newToken != null && newToken.isNotEmpty) {
        _token = newToken;
        _user = newUser;
        _lastPassword = password;
        
        // Save new token
        await _secureStorage.write(key: _tokenKey, value: _token!);
        await _secureStorage.write(key: _biometricTokenKey, value: _token!);
        
        if (!_hasMeaningfulProfile(_user)) {
          final fresh = await _fetchMe(_token!);
          if (fresh != null) _user = fresh;
        }
        _setError(null);
        notifyListeners();
        return true;
      }
      return false;
    } catch (e) {
      debugPrint('[Session] Biometric silent login failed: $e');
      return false;
    }
  }


  /// Securely re-fetches the user profile if it is missing or needs synchronization.
  Future<void> syncProfileIfNeeded() async {
    if (_token == null || _token!.isEmpty) return;
    if (_loading) return;
    
    try {
      final fresh = await _fetchMe(_token!);
      if (fresh != null) {
        _user = fresh;
        _lastUser = fresh;
        
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString(_lastUserJsonKey, jsonEncode(fresh));
        notifyListeners();
        debugPrint('[Session] Silently synchronized missing profile data successfully.');
      }
    } catch (e) {
      debugPrint('[Session] Lazy profile sync failed: $e');
    }
  }

  void updateUser(Map<String, dynamic> user) {
    _user = user;
    notifyListeners();
  }

  Future<void> updateUserField(String key, dynamic value) async {
    if (_user == null) return;
    final updated = Map<String, dynamic>.from(_user!);
    updated[key] = value;
    _user = updated;
    _lastUser = updated;
    
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_lastUserJsonKey, jsonEncode(updated));
    notifyListeners();
  }

  Future<void> uploadProfileImage(File image) async {
    if (_token == null) return;
    _loading = true;
    _error = null;
    notifyListeners();

    try {
      final updatedUser = await AuthService(token: _token).uploadProfileImage(image);
      _user = updatedUser;
      _lastUser = updatedUser;
      
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_lastUserJsonKey, jsonEncode(updatedUser));
      
      _loading = false;
      notifyListeners();
    } catch (e) {
      _loading = false;
      _error = e.toString();
      notifyListeners();
      rethrow;
    }
  }

  Future<void> acknowledgeAgentUpgrade() async {
    if (_token == null) return;
    try {
      await AuthService(token: _token).acknowledgeAgentUpgrade();
      if (_user != null) {
        final updated = Map<String, dynamic>.from(_user!);
        updated['agent_upgrade_seen'] = true;
        _user = updated;
        _lastUser = updated;
        
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString(_lastUserJsonKey, jsonEncode(updated));
        notifyListeners();
      }
    } catch (e) {
      debugPrint('[Session] Acknowledge agent upgrade failed: $e');
    }
  }

  void _setLoading(bool value) {
    _loading = value;
    notifyListeners();
  }

  void _setError(String? message) {
    _error = message;
    notifyListeners();
  }

  String _friendlyError(Object error) {
    final raw = error.toString().trim();
    if (raw.startsWith('Exception: ')) {
      return raw.substring('Exception: '.length);
    }
    if (raw.startsWith('ApiException(')) {
      final idx = raw.indexOf(':');
      if (idx != -1 && idx + 1 < raw.length) {
        return raw.substring(idx + 1).trim();
      }
    }
    return raw;
  }
}
