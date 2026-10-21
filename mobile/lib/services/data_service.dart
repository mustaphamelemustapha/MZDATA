import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../config.dart';
import 'api_client.dart';

class DataService {
  DataService({required this.token});

  final String token;

  ApiClient get _client => ApiClient(baseUrl: AppConfig.baseUrl, token: token);

  // In-memory instant cache (persists across screens for 0ms loading)
  static List<dynamic> _memoryCache = [];
  static DateTime? _lastFetchTime;
  static const String _prefsKey = 'cached_data_plans_v1';

  static List<dynamic> get cachedPlans => List<dynamic>.unmodifiable(_memoryCache);

  static Future<void> initCache() async {
    if (_memoryCache.isNotEmpty) return;
    try {
      final prefs = await SharedPreferences.getInstance();
      final str = prefs.getString(_prefsKey);
      if (str != null && str.isNotEmpty) {
        final decoded = jsonDecode(str);
        if (decoded is List && decoded.isNotEmpty) {
          _memoryCache = decoded;
        }
      }
    } catch (_) {}
  }

  static void clearCache() {
    _memoryCache = [];
    _lastFetchTime = null;
    SharedPreferences.getInstance().then((p) => p.remove(_prefsKey)).catchError((_) => false);
  }

  Future<List<dynamic>> getPlans({bool forceRefresh = false}) async {
    // 1. Return in-memory cache immediately if available and fresh
    if (!forceRefresh && _memoryCache.isNotEmpty) {
      final age = _lastFetchTime != null
          ? DateTime.now().difference(_lastFetchTime!).inSeconds
          : 999;
      // If older than 90s, silently sync in background without blocking UI
      if (age > 90) {
        _fetchAndCache(silent: true).ignore();
      }
      return _memoryCache;
    }

    // 2. Check disk cache if in-memory is empty
    if (!forceRefresh && _memoryCache.isEmpty) {
      await initCache();
      if (_memoryCache.isNotEmpty) {
        _fetchAndCache(silent: true).ignore();
        return _memoryCache;
      }
    }

    // 3. Fast network fetch with 6s timeout
    return await _fetchAndCache(silent: false, forceRefresh: forceRefresh);
  }

  Future<List<dynamic>> _fetchAndCache({
    bool silent = false,
    bool forceRefresh = false,
  }) async {
    List<dynamic>? list;
    try {
      final data = await _client.get(
        '/data/plans',
        forceRefresh: forceRefresh,
        timeout: const Duration(seconds: 6),
      );
      list = _extractList(data);
    } catch (_) {
      // Handled below with fallback & cache
    }

    if (list != null && list.isNotEmpty) {
      _memoryCache = list;
      _lastFetchTime = DateTime.now();
      SharedPreferences.getInstance().then((prefs) {
        prefs.setString(_prefsKey, jsonEncode(list));
      }).catchError((_) {});
      return list;
    }

    // Fallback: Check admin data plans endpoint if user has permissions
    try {
      final adminData = await _client.get(
        '/admin/data-plans',
        timeout: const Duration(seconds: 4),
      );
      final adminList = _extractList(adminData);
      if (adminList != null && adminList.isNotEmpty) {
        final mapped = adminList
            .where((p) => p is Map && p['is_active'] != false)
            .map((p) => {
                  ...p as Map,
                  'price': p['display_price'] ?? p['base_price'] ?? 0,
                })
            .toList();
        if (mapped.isNotEmpty) {
          _memoryCache = mapped;
          _lastFetchTime = DateTime.now();
          SharedPreferences.getInstance().then((prefs) {
            prefs.setString(_prefsKey, jsonEncode(mapped));
          }).catchError((_) {});
          return mapped;
        }
      }
    } catch (_) {}

    if (_memoryCache.isNotEmpty) {
      return _memoryCache;
    }
    return list ?? <dynamic>[];
  }

  List<dynamic>? _extractList(dynamic data) {
    if (data is List) return data;
    if (data is Map) {
      final rawList = data['data'] ?? data['plans'] ?? data['items'] ?? data['results'];
      if (rawList is List) return rawList;
    }
    return null;
  }

  Future<Map<String, dynamic>> purchase({
    required String planCode,
    required String phoneNumber,
    required bool ported,
    String? clientRequestId,
    int? userPromoId,
  }) async {
    return _client.post('/data/purchase', {
      'plan_code': planCode,
      'phone_number': phoneNumber,
      'ported_number': ported,
      if (clientRequestId != null && clientRequestId.trim().isNotEmpty)
        'client_request_id': clientRequestId.trim(),
      if (userPromoId != null) 'user_promo_id': userPromoId,
    });
  }
}
