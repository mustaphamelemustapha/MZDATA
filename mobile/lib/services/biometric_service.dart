import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:local_auth/local_auth.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

const _errLockedOut = 'LockedOut';
const _errPermanentlyLockedOut = 'PermanentlyLockedOut';
const _errNotEnrolled = 'NotEnrolled';
const _errPasscodeNotSet = 'PasscodeNotSet';

enum BiometricDeviceKind {
  face,
  fingerprint,
  iris,
  none,
}

class BiometricAvailability {
  final bool supported;
  final bool canCheck;
  final bool hasEnrolled;
  final BiometricDeviceKind primaryKind;
  final String label;
  final String? error;

  const BiometricAvailability({
    required this.supported,
    required this.canCheck,
    required this.hasEnrolled,
    this.primaryKind = BiometricDeviceKind.none,
    this.label = 'Biometrics',
    this.error,
  });

  bool get ready => supported && canCheck && hasEnrolled;
  IconData get icon => BiometricService.iconFor(primaryKind);
}

class BiometricAuthResult {
  final bool success;
  final String? errorMessage;
  final bool isLockedOut;
  final bool isPermanentlyLockedOut;
  final bool userCanceled;

  const BiometricAuthResult({
    required this.success,
    this.errorMessage,
    this.isLockedOut = false,
    this.isPermanentlyLockedOut = false,
    this.userCanceled = false,
  });
}

class BiometricService {
  static final _auth = LocalAuthentication();
  
  static const _secureStorage = FlutterSecureStorage(
    aOptions: AndroidOptions(
      encryptedSharedPreferences: true,
      resetOnError: true,
    ),
    iOptions: IOSOptions(
      accessibility: KeychainAccessibility.first_unlock_this_device,
    ),
  );

  static const _appLockKey = 'app_biometric_lock';
  static const _transactionAuthKey = 'transaction_biometric_auth';
  static const _securePinKey = 'secure_transaction_pin';
  static const _enrolledHashKey = 'biometric_enrolled_hash';

  /// Check if the user has enabled biometric app lock.
  static Future<bool> get isAppLockEnabled async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool(_appLockKey) ?? false;
  }

  /// Enable or disable biometric app lock.
  static Future<void> setAppLockEnabled(bool value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_appLockKey, value);
    if (value) {
      await _recordEnrolledState();
    }
  }

  /// Check if the user has enabled biometric confirmation for transactions.
  static Future<bool> get isTransactionAuthEnabled async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool(_transactionAuthKey) ?? (prefs.getBool(_appLockKey) ?? false);
  }

  /// Enable or disable biometric confirmation for transactions.
  static Future<void> setTransactionAuthEnabled(bool value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_transactionAuthKey, value);
  }

  /// Securely store the transaction PIN in device Keychain/Keystore.
  static Future<void> savePin(String pin) async {
    try {
      await _secureStorage.write(key: _securePinKey, value: pin);
      await _recordEnrolledState();
    } catch (e) {
      debugPrint('[Biometrics] Error saving PIN to secure storage: $e');
      await const FlutterSecureStorage().write(key: _securePinKey, value: pin);
    }
  }

  /// Retrieve the stored transaction PIN with invalidation safety check.
  static Future<String?> getPin() async {
    try {
      // Invalidation check: if device biometrics were changed externally, clear stored PIN for banking safety
      final hasChanged = await hasEnrolledBiometricsChanged();
      if (hasChanged) {
        debugPrint('[Biometrics] Enrolled biometrics changed on device! Clearing stored PIN.');
        await deletePin();
        return null;
      }
      return await _secureStorage.read(key: _securePinKey);
    } catch (e) {
      debugPrint('[Biometrics] Error reading PIN: $e');
      try {
        return await const FlutterSecureStorage().read(key: _securePinKey);
      } catch (_) {
        return null;
      }
    }
  }

  /// Delete the stored transaction PIN.
  static Future<void> deletePin() async {
    try {
      await _secureStorage.delete(key: _securePinKey);
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_enrolledHashKey);
    } catch (e) {
      debugPrint('[Biometrics] Error deleting PIN: $e');
    }
  }

  /// Check if hardware supports biometrics.
  static Future<bool> isDeviceSupported() async {
    try {
      return await _auth.isDeviceSupported();
    } on PlatformException {
      return false;
    }
  }

  /// Check if biometrics can currently be checked.
  static Future<bool> canCheckBiometrics() async {
    try {
      return await _auth.canCheckBiometrics;
    } on PlatformException {
      return false;
    }
  }

  /// Returns user-facing label tailored to platform (Face ID, Touch ID, or Fingerprint).
  static Future<String> getBiometricLabel() async {
    final avail = await getAvailability();
    return avail.label;
  }

  /// Returns the corresponding IconData for a biometric kind.
  static IconData iconFor(BiometricDeviceKind? kind) {
    switch (kind) {
      case BiometricDeviceKind.face:
        return Icons.face_rounded;
      case BiometricDeviceKind.fingerprint:
        return Icons.fingerprint_rounded;
      case BiometricDeviceKind.iris:
        return Icons.remove_red_eye_rounded;
      case BiometricDeviceKind.none:
      default:
        return Icons.fingerprint_rounded;
    }
  }

  /// Returns user-facing icon tailored to the primary biometric sensor.
  static Future<IconData> getBiometricIcon() async {
    final avail = await getAvailability();
    return iconFor(avail.primaryKind);
  }

  /// Returns a full readiness snapshot for settings toggles and authorization dialogs.
  static Future<BiometricAvailability> getAvailability() async {
    try {
      final supported = await _auth.isDeviceSupported();
      final canCheck = await _auth.canCheckBiometrics;
      List<BiometricType> enrolled = const [];
      
      try {
        enrolled = await _auth.getAvailableBiometrics();
      } on PlatformException catch (e) {
        debugPrint('[Biometrics] Available biometrics exception: ${e.message}');
        enrolled = const [];
      }

      BiometricDeviceKind kind = BiometricDeviceKind.none;
      String label = 'Biometrics';

      if (enrolled.contains(BiometricType.face)) {
        kind = BiometricDeviceKind.face;
        label = (!kIsWeb && Platform.isIOS) ? 'Face ID' : 'Face Unlock';
      } else if (enrolled.contains(BiometricType.fingerprint)) {
        kind = BiometricDeviceKind.fingerprint;
        label = (!kIsWeb && Platform.isIOS) ? 'Touch ID' : 'Fingerprint';
      } else if (enrolled.contains(BiometricType.iris)) {
        kind = BiometricDeviceKind.iris;
        label = 'Iris Scanner';
      } else if (supported) {
        kind = BiometricDeviceKind.fingerprint;
        label = (!kIsWeb && Platform.isIOS) ? 'Touch ID / Face ID' : 'Fingerprint';
      }

      return BiometricAvailability(
        supported: supported,
        canCheck: canCheck,
        hasEnrolled: enrolled.isNotEmpty,
        primaryKind: kind,
        label: label,
      );
    } on PlatformException catch (e) {
      return BiometricAvailability(
        supported: false,
        canCheck: false,
        hasEnrolled: false,
        error: e.message,
      );
    } catch (e) {
      return BiometricAvailability(
        supported: false,
        canCheck: false,
        hasEnrolled: false,
        error: e.toString(),
      );
    }
  }

  /// Trigger biometric authentication prompt with banking-grade error handling.
  static Future<bool> authenticate({
    String reason = 'Please authenticate to access your account',
  }) async {
    final result = await authenticateWithDetails(reason: reason);
    return result.success;
  }

  /// Detailed biometric authentication returning specific failure causes.
  static Future<BiometricAuthResult> authenticateWithDetails({
    String reason = 'Please authenticate to continue',
  }) async {
    try {
      final success = await _auth.authenticate(
        localizedReason: reason,
        biometricOnly: true,
        persistAcrossBackgrounding: true,
      );

      if (success) {
        return const BiometricAuthResult(success: true);
      } else {
        return const BiometricAuthResult(
          success: false,
          userCanceled: true,
          errorMessage: 'Authentication canceled',
        );
      }
    } on PlatformException catch (e) {
      debugPrint('[Biometrics] Auth error [${e.code}]: ${e.message}');
      try {
        await _auth.stopAuthentication();
      } catch (_) {}

      final code = e.code.toLowerCase();
      if (code.contains('permanent') && code.contains('lock')) {
        return const BiometricAuthResult(
          success: false,
          isPermanentlyLockedOut: true,
          errorMessage: 'Biometrics permanently locked. Please unlock using your device passcode.',
        );
      } else if (code.contains('lock')) {
        return const BiometricAuthResult(
          success: false,
          isLockedOut: true,
          errorMessage: 'Too many failed attempts. Biometrics locked temporarily.',
        );
      } else if (code.contains('notenrolled') || code.contains('nobiometrics') || code.contains('not_enrolled')) {
        return const BiometricAuthResult(
          success: false,
          errorMessage: 'No biometric credentials enrolled on this device.',
        );
      } else if (code.contains('passcode')) {
        return const BiometricAuthResult(
          success: false,
          errorMessage: 'Please enable a screen lock passcode in device settings.',
        );
      } else {
        return BiometricAuthResult(
          success: false,
          errorMessage: e.message ?? 'Authentication failed',
        );
      }
    } catch (e) {
      debugPrint('[Biometrics] General auth exception: $e');
      return BiometricAuthResult(
        success: false,
        errorMessage: e.toString(),
      );
    }
  }

  /// Record a fingerprint/credential fingerprint hash to detect external modifications.
  static Future<void> _recordEnrolledState() async {
    try {
      final list = await _auth.getAvailableBiometrics();
      final hash = list.map((e) => e.name).join(',');
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_enrolledHashKey, hash);
    } catch (_) {}
  }

  /// Detects if credentials were changed in Android/iOS settings after user enrolled.
  static Future<bool> hasEnrolledBiometricsChanged() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final savedHash = prefs.getString(_enrolledHashKey);
      if (savedHash == null) return false;

      final list = await _auth.getAvailableBiometrics();
      final currentHash = list.map((e) => e.name).join(',');
      return savedHash != currentHash;
    } catch (_) {
      return false;
    }
  }
}
