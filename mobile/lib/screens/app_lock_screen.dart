import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../state/session.dart';
import '../widgets/auth_backdrop.dart';
import '../services/api_client.dart';
import '../services/biometric_service.dart';
import '../services/transaction_pin_service.dart';

class SlateColors {
  static const Color slate = Color(0xFF64748B);
  static const Color shade50 = Color(0xFFF8FAFC);
  static const Color shade100 = Color(0xFFF1F5F9);
  static const Color shade200 = Color(0xFFE2E8F0);
  static const Color shade300 = Color(0xFFCBD5E1);
  static const Color shade400 = Color(0xFF94A3B8);
  static const Color shade500 = Color(0xFF64748B);
  static const Color shade600 = Color(0xFF475569);
  static const Color shade700 = Color(0xFF334155);
  static const Color shade900 = Color(0xFF0F172A);
}

class AppLockScreen extends StatefulWidget {
  const AppLockScreen({super.key});

  @override
  State<AppLockScreen> createState() => _AppLockScreenState();
}

class _AppLockScreenState extends State<AppLockScreen> with SingleTickerProviderStateMixin {
  String _pinCode = '';
  bool _checkingBiometrics = false;
  bool _hasBiometrics = false;
  bool _isVerifyingPin = false;
  String? _errorMessage;

  late AnimationController _shakeController;
  late Animation<double> _shakeAnimation;

  @override
  void initState() {
    super.didChangeDependencies();
    super.initState();
    
    // Set up shake animation for incorrect PIN feedback
    _shakeController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 500),
    );
    _shakeAnimation = _ShakeTween(begin: 0.0, end: 24.0)
        .animate(_shakeController);

    _checkAndTriggerBiometrics();
  }

  @override
  void dispose() {
    _shakeController.dispose();
    super.dispose();
  }

  Future<void> _checkAndTriggerBiometrics() async {
    final bioEnabled = await BiometricService.isAppLockEnabled;
    final availability = await BiometricService.getAvailability();
    if (bioEnabled && availability.ready) {
      setState(() {
        _hasBiometrics = true;
      });
      // Automatically trigger biometrics without asking
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _triggerBiometrics();
      });
    }
  }

  Future<void> _triggerBiometrics() async {
    if (_checkingBiometrics) return;
    setState(() {
      _checkingBiometrics = true;
      _errorMessage = null;
    });

    try {
      final success = await BiometricService.authenticate(
        reason: 'Authenticate to unlock MZDATA',
      );
      if (success && mounted) {
        context.read<SessionController>().unlock();
      }
    } catch (e) {
      if (mounted) {
        setState(() => _errorMessage = 'Biometric authentication failed or is unavailable.');
      }
    } finally {
      if (mounted) {
        setState(() {
          _checkingBiometrics = false;
        });
      }
    }
  }

  void _handleKeyPress(String value) {
    if (_isVerifyingPin || _pinCode.length >= 4) return;

    setState(() {
      _pinCode += value;
      _errorMessage = null;
    });

    if (_pinCode.length == 4) {
      _verifyPinCode();
    }
  }

  void _handleBackspace() {
    if (_isVerifyingPin || _pinCode.isEmpty) return;
    setState(() {
      _pinCode = _pinCode.substring(0, _pinCode.length - 1);
      _errorMessage = null;
    });
  }

  Future<void> _verifyPinCode() async {
    setState(() {
      _isVerifyingPin = true;
    });

    final session = context.read<SessionController>();
    final token = (session.token ?? '').trim();

    try {
      final service = TransactionPinService(token: token);
      await service.verify(_pinCode);
      
      if (mounted) {
        session.unlock();
      }
    } catch (e) {
      if (mounted) {
        String err = 'Incorrect PIN, try again.';
        if (e is ApiException && (e.statusCode == 401 || e.statusCode == 403)) {
          err = 'Session expired. Tap "Use Password" to log in again.';
        }
        setState(() {
          _pinCode = '';
          _isVerifyingPin = false;
          _errorMessage = err;
        });
        _shakeController.forward(from: 0.0);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final session = context.watch<SessionController>();
    final user = session.user ?? session.lastUser ?? {};
    final profileImageUrl = user['profile_image_url'] as String?;
    final name = (user['full_name'] ?? user['name'] ?? 'U').toString().trim();
    final initials = name.isNotEmpty ? name.substring(0, 1).toUpperCase() : 'U';

    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      body: SafeArea(
        child: SingleChildScrollView(
          physics: const BouncingScrollPhysics(),
          child: Column(
            children: [
              const SizedBox(height: 48),
              
              // Avatar / Logo
              Center(
                child: CircleAvatar(
                  radius: 42,
                  backgroundColor: theme.colorScheme.primary.withValues(alpha: 0.1),
                  backgroundImage: profileImageUrl != null && profileImageUrl.isNotEmpty
                      ? NetworkImage(profileImageUrl)
                      : const AssetImage('assets/brand/meledata-icon.png') as ImageProvider,
                  child: profileImageUrl != null && profileImageUrl.isNotEmpty
                      ? null
                      : null,
                ),
              ),
              const SizedBox(height: 24),

              // Title
              Text(
                'Enter Passcode',
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w700,
                  fontSize: 18,
                  color: isDark ? Colors.white : SlateColors.shade900,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              
              // Subtitle or Error Message
              if (_errorMessage != null)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(
                    color: theme.colorScheme.error.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    _errorMessage!,
                    style: TextStyle(
                      color: theme.colorScheme.error,
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                )
              else
                const SizedBox(height: 24),

            // PIN Indicator Dots with Shake Animation
            AnimatedBuilder(
              animation: _shakeAnimation,
              builder: (context, child) {
                return Transform.translate(
                  offset: Offset(_shakeAnimation.value, 0.0),
                  child: child,
                );
              },
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(4, (index) {
                  final active = index < _pinCode.length;
                  return AnimatedContainer(
                    duration: const Duration(milliseconds: 150),
                    margin: const EdgeInsets.symmetric(horizontal: 10),
                    width: 14,
                    height: 14,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(4), // Square for brutalism
                      color: active
                          ? theme.colorScheme.primary
                          : Colors.transparent,
                      border: Border.all(
                        color: active ? theme.colorScheme.primary : theme.colorScheme.outline,
                        width: 2,
                      ),
                    ),
                  );
                }),
              ),
            ),

            const SizedBox(height: 20),

            // Premium Custom Passcode Numeric Keypad
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 32),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      _KeypadButton(number: '1', label: '', onTap: () => _handleKeyPress('1')),
                      _KeypadButton(number: '2', label: 'A B C', onTap: () => _handleKeyPress('2')),
                      _KeypadButton(number: '3', label: 'D E F', onTap: () => _handleKeyPress('3')),
                    ],
                  ),
                  const SizedBox(height: 18),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      _KeypadButton(number: '4', label: 'G H I', onTap: () => _handleKeyPress('4')),
                      _KeypadButton(number: '5', label: 'J K L', onTap: () => _handleKeyPress('5')),
                      _KeypadButton(number: '6', label: 'M N O', onTap: () => _handleKeyPress('6')),
                    ],
                  ),
                  const SizedBox(height: 18),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      _KeypadButton(number: '7', label: 'P Q R S', onTap: () => _handleKeyPress('7')),
                      _KeypadButton(number: '8', label: 'T U V', onTap: () => _handleKeyPress('8')),
                      _KeypadButton(number: '9', label: 'W X Y Z', onTap: () => _handleKeyPress('9')),
                    ],
                  ),
                  const SizedBox(height: 18),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      // Biometric Action button
                      _KeypadIconButton(
                        icon: Icons.fingerprint_rounded,
                        onTap: _hasBiometrics ? _triggerBiometrics : null,
                      ),
                      _KeypadButton(number: '0', label: '', onTap: () => _handleKeyPress('0')),
                      // Delete / Backspace button
                      _KeypadIconButton(
                        icon: Icons.backspace_rounded,
                        onTap: _handleBackspace,
                      ),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // Bottom Actions (Sign out)
            SafeArea(
              top: false,
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                child: Center(
                  child: TextButton(
                    onPressed: () {
                      context.read<SessionController>().logout();
                    },
                    style: TextButton.styleFrom(
                      foregroundColor: isDark ? Colors.white70 : SlateColors.shade500,
                    ),
                    child: const Text(
                      'Sign out',
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
      ),
    );
  }
}

// Shake animation tween for incorrect PIN entry feedback
class _ShakeTween extends Tween<double> {
  _ShakeTween({super.begin, super.end});
  @override
  double lerp(double t) {
    return begin! + (end! - begin!) * math.sin(t * 3 * math.pi);
  }
}

// Custom Glass-style Numeric Keypad Button
class _KeypadButton extends StatelessWidget {
  const _KeypadButton({
    required this.number,
    required this.label,
    required this.onTap,
  });

  final String number;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Container(
        width: 76,
        height: 76,
        decoration: const BoxDecoration(
          shape: BoxShape.circle,
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              number,
              style: TextStyle(
                fontSize: 32,
                fontWeight: FontWeight.w400,
                color: isDark ? Colors.white : SlateColors.shade900,
              ),
            ),
            if (label.isNotEmpty) ...[
              const SizedBox(height: 2),
              Text(
                label,
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w600,
                  color: isDark ? Colors.white54 : SlateColors.shade500,
                  letterSpacing: 1.5,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

// Custom Glass-style Keypad Icon Button (For Backspace & Biometric trigger)
class _KeypadIconButton extends StatelessWidget {
  const _KeypadIconButton({
    required this.icon,
    this.onTap,
  });

  final IconData icon;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    if (onTap == null) {
      return const SizedBox(width: 76, height: 76);
    }

    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Container(
        width: 76,
        height: 76,
        decoration: const BoxDecoration(
          shape: BoxShape.circle,
        ),
        child: Center(
          child: Icon(
            icon,
            size: 28,
            color: isDark ? Colors.white : SlateColors.shade900,
          ),
        ),
      ),
    );
  }
}
