import '../config.dart';
import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import 'package:google_fonts/google_fonts.dart';
import '../services/biometric_service.dart';
import '../state/session.dart';
import '../widgets/auth_liquid_glass.dart';
import '../widgets/concentric_circles_bg.dart';
import '../widgets/state_select_sheet.dart';
import 'forgot_password_screen.dart';
import 'shell_screen.dart';
import 'welcome_screen.dart';

class AuthPasswordScreen extends StatefulWidget {
  const AuthPasswordScreen({
    super.key,
    required this.identifier,
    this.autoPromptBiometrics = true,
  });

  static const String route = '/auth-password';

  final String identifier;
  final bool autoPromptBiometrics;

  @override
  State<AuthPasswordScreen> createState() => _AuthPasswordScreenState();
}

class _AuthPasswordScreenState extends State<AuthPasswordScreen> {
  final TextEditingController _passwordCtrl = TextEditingController();
  final FocusNode _passwordFocusNode = FocusNode();
  final GlobalKey<ShakeWidgetState> _shakeKey = GlobalKey<ShakeWidgetState>();

  bool _obscurePassword = true;
  bool _loading = false;
  bool _biometricChecking = false;
  bool _hasBiometrics = false;
  String _biometricLabel = 'Biometrics';
  IconData _biometricIcon = Icons.fingerprint_rounded;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _initBiometrics().then((_) {
      if (mounted && widget.autoPromptBiometrics && _hasBiometrics) {
        _checkAndTriggerBiometrics();
      } else if (mounted) {
        _passwordFocusNode.requestFocus();
      }
    });
  }

  Future<void> _initBiometrics() async {
    try {
      final avail = await BiometricService.getAvailability();
      if (!mounted) return;
      final session = context.read<SessionController>();
      final isUserMatch = await session.hasBiometricsFor(widget.identifier);
      if (mounted) {
        setState(() {
          _hasBiometrics = avail.supported && isUserMatch;
          _biometricLabel = avail.label;
          _biometricIcon = avail.icon;
        });
      }
    } catch (_) {}
  }

  @override
  void dispose() {
    _passwordCtrl.dispose();
    _passwordFocusNode.dispose();
    super.dispose();
  }

  Future<void> _checkAndTriggerBiometrics({bool isManual = false}) async {
    final session = context.read<SessionController>();
    final isUserMatch = await session.hasBiometricsFor(widget.identifier);
    if (!isUserMatch) {
      if (mounted) _passwordFocusNode.requestFocus();
      return;
    }

    if (!isManual) {
      final enabled = await BiometricService.isAppLockEnabled;
      if (!enabled) {
        if (mounted) _passwordFocusNode.requestFocus();
        return;
      }
    }

    final availability = await BiometricService.getAvailability();
    if (!availability.supported) {
      if (mounted) _passwordFocusNode.requestFocus();
      return;
    }

    setState(() => _biometricChecking = true);

    try {
      final success = await BiometricService.authenticate(
        reason: 'Sign in to ${AppConfig.appName}',
      );

      if (!mounted) return;

      if (success) {
        final session = context.read<SessionController>();
        final ok = await session.loginWithBiometrics(targetIdentifier: widget.identifier);
        if (!mounted) return;

        if (ok) {
          HapticFeedback.mediumImpact();
          await _onLoginSuccess();
          return;
        }
      }
    } catch (_) {
      // Biometric failure falls back to password field cleanly
    } finally {
      if (mounted) {
        setState(() => _biometricChecking = false);
        _passwordFocusNode.requestFocus();
      }
    }
  }

  Future<void> _handleLogin() async {
    final password = _passwordCtrl.text;
    if (password.isEmpty) {
      HapticFeedback.heavyImpact();
      setState(() => _errorMessage = 'Please enter your password');
      _shakeKey.currentState?.shake();
      return;
    }

    if (_loading) return;

    HapticFeedback.lightImpact();
    FocusScope.of(context).unfocus();

    setState(() {
      _loading = true;
      _errorMessage = null;
    });

    final session = context.read<SessionController>();
    final ok = await session.login(widget.identifier, password);

    if (!mounted) return;

    if (ok) {
      HapticFeedback.mediumImpact();
      await _offerBiometricsIfAvailable();
      if (!mounted) return;
      await _onLoginSuccess();
      return;
    }

    // Login failed
    HapticFeedback.heavyImpact();
    String err = session.error ?? 'Invalid credentials. Please try again.';
    final lower = err.toLowerCase();
    if (lower.contains('locked') || lower.contains('too many')) {
      err = 'Account temporarily locked due to too many attempts. Please try again later or reset your password.';
    } else if (lower.contains('inactive')) {
      err = 'Account is inactive. Please contact support.';
    }

    setState(() {
      _loading = false;
      _errorMessage = err;
    });
    _shakeKey.currentState?.shake();
  }

  Future<void> _offerBiometricsIfAvailable() async {
    final enabled = await BiometricService.isAppLockEnabled;
    if (enabled) return;

    final availability = await BiometricService.getAvailability();
    if (!availability.supported || !availability.hasEnrolled) return;

    // Prompt user to enable biometrics
    if (!mounted) return;
    await showDialog(
      context: context,
      builder: (ctx) {
        return AlertDialog(
          backgroundColor: const Color(0xFF0F172A),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: const Row(
            children: [
              Icon(Icons.fingerprint_rounded, color: Color(0xFF2457F5), size: 28),
              SizedBox(width: 10),
              Text(
                'Enable Biometrics?',
                style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w700),
              ),
            ],
          ),
          content: const Text(
            'Would you like to use Face ID or Fingerprint for faster sign in next time?',
            style: TextStyle(color: Colors.white70, fontSize: 14),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(),
              child: const Text('Not now', style: TextStyle(color: Colors.white60)),
            ),
            ElevatedButton(
              onPressed: () async {
                await BiometricService.setAppLockEnabled(true);
                if (ctx.mounted) Navigator.of(ctx).pop();
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF2457F5),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: const Text('Enable'),
            ),
          ],
        );
      },
    );
  }

  Future<void> _onLoginSuccess() async {
    final session = context.read<SessionController>();

    // Rule 13: Check if state is null
    final user = session.user;
    final state = user?['state'];

    void navigateToDashboard() {
      Navigator.of(context).pushAndRemoveUntil(
        PageRouteBuilder(
          pageBuilder: (context, animation, secondaryAnimation) => const ShellScreen(),
          transitionsBuilder: (context, animation, secondaryAnimation, child) {
            return FadeTransition(
              opacity: CurvedAnimation(
                parent: animation,
                curve: Curves.easeOutCubic,
              ),
              child: child,
            );
          },
          transitionDuration: const Duration(milliseconds: 300),
        ),
        (_) => false,
      );
    }

    if (state == null || state.toString().trim().isEmpty) {
      if (!mounted) return;
      StateSelectBottomSheet.show(context, onCompleted: () {
        if (!mounted) return;
        navigateToDashboard();
      });
      return;
    }

    // Proceed to Dashboard smoothly
    navigateToDashboard();
  }

  void _handleChangePhone() {
    HapticFeedback.lightImpact();
    // Return to Step 1 keeping phone prefilled, clearing password
    Navigator.of(context).pushAndRemoveUntil(
      PageRouteBuilder(
        pageBuilder: (context, animation, secondaryAnimation) =>
            WelcomeScreen(initialPhone: widget.identifier),
        transitionsBuilder: (context, animation, secondaryAnimation, child) {
          final curved = CurvedAnimation(
            parent: animation,
            curve: Curves.easeOutCubic,
          );
          return FadeTransition(
            opacity: curved,
            child: SlideTransition(
              position: Tween<Offset>(
                begin: const Offset(-0.08, 0.0),
                end: Offset.zero,
              ).animate(curved),
              child: child,
            ),
          );
        },
        transitionDuration: const Duration(milliseconds: 280),
      ),
      (_) => false,
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final session = context.watch<SessionController>();
    final lastUserName = session.lastUser?['full_name'] ?? session.lastUser?['name'];
    String greeting = 'Welcome back';
    if (lastUserName != null && lastUserName.toString().trim().isNotEmpty) {
      final first = lastUserName.toString().trim().split(' ').first;
      if (first.isNotEmpty) {
        greeting = 'Welcome back, $first';
      }
    }

    return Scaffold(
      body: GestureDetector(
        onTap: () => FocusScope.of(context).unfocus(),
        child: ConcentricCirclesBg(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Top Bar with Back Button
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: IconButton(
                  onPressed: () {
                    if (Navigator.of(context).canPop()) {
                      Navigator.of(context).pop();
                    } else {
                      _handleChangePhone();
                    }
                  },
                  icon: Icon(
                    Icons.arrow_back_ios_new_rounded,
                    color: theme.colorScheme.onSurface,
                    size: 20,
                  ),
                ),
              ),

              // Scrollable Content
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
                  children: [
                    const SizedBox(height: 12),

                    // Header title
                    Text(
                      greeting,
                      style: GoogleFonts.plusJakartaSans(
                        color: theme.colorScheme.onSurface,
                        fontSize: 28,
                        height: 1.15,
                        fontWeight: FontWeight.w800,
                        letterSpacing: -0.6,
                      ),
                    ),

                    const SizedBox(height: 6),
                    Text(
                      'Enter your password to sign in.',
                      style: GoogleFonts.plusJakartaSans(
                        color: theme.colorScheme.onSurface.withValues(alpha: 0.7),
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                      ),
                    ),

                    const SizedBox(height: 20),

                    // Phone Pill with Change button
                    PhonePill(
                      phone: widget.identifier,
                      onChange: _handleChangePhone,
                    ),

                    const SizedBox(height: 36),

                    // Password Input Section
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Label: Electric Blue uppercase bold
                          Padding(
                            padding: const EdgeInsets.only(bottom: 8, left: 4),
                            child: Text(
                              'PASSWORD',
                              style: GoogleFonts.plusJakartaSans(
                                color: isDark ? theme.colorScheme.primary : const Color(0xFF0F172A),
                                fontSize: 11,
                                fontWeight: FontWeight.w800,
                                letterSpacing: 1.2,
                              ),
                            ),
                          ),

                          // Password Field
                          ShakeWidget(
                            key: _shakeKey,
                            child: AnimatedContainer(
                              duration: const Duration(milliseconds: 200),
                              height: 56,
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(16),
                                boxShadow: _passwordFocusNode.hasFocus
                                    ? [
                                        BoxShadow(
                                          color: const Color(0xFF2563EB).withValues(alpha: isDark ? 0.25 : 0.12),
                                          blurRadius: 12,
                                          spreadRadius: 3,
                                        ),
                                      ]
                                    : [],
                              ),
                              child: TextField(
                                controller: _passwordCtrl,
                                focusNode: _passwordFocusNode,
                                obscureText: _obscurePassword,
                                textInputAction: TextInputAction.done,
                                onSubmitted: (_) => _handleLogin(),
                                onChanged: (_) {
                                  if (_errorMessage != null) {
                                    setState(() => _errorMessage = null);
                                  }
                                },
                                style: GoogleFonts.plusJakartaSans(
                                  color: theme.colorScheme.onSurface,
                                  fontSize: 16,
                                  fontWeight: FontWeight.w600,
                                ),
                                cursorColor: const Color(0xFF2563EB),
                                decoration: InputDecoration(
                                  hintText: 'Enter your password',
                                  hintStyle: GoogleFonts.plusJakartaSans(
                                    color: theme.colorScheme.onSurface.withValues(alpha: isDark ? 0.35 : 0.4),
                                    fontSize: 15,
                                    fontWeight: FontWeight.w500,
                                  ),
                                  prefixIcon: Icon(
                                    Icons.lock_outline_rounded,
                                    size: 20,
                                    color: _passwordFocusNode.hasFocus
                                        ? const Color(0xFF2563EB)
                                        : theme.colorScheme.onSurface.withValues(alpha: 0.4),
                                  ),
                                  suffixIcon: IconButton(
                                    onPressed: () {
                                      setState(() {
                                        _obscurePassword = !_obscurePassword;
                                      });
                                    },
                                    icon: Icon(
                                      _obscurePassword
                                          ? Icons.visibility_off_rounded
                                          : Icons.visibility_rounded,
                                      color: theme.colorScheme.onSurface.withValues(alpha: 0.4),
                                      size: 20,
                                    ),
                                  ),
                                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 0),
                                  filled: true,
                                  fillColor: isDark ? const Color(0xFF131B2E) : const Color(0xFFF8FAFC),
                                  border: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(16),
                                    borderSide: BorderSide(
                                      color: theme.colorScheme.outline.withValues(alpha: isDark ? 0.12 : 0.08),
                                      width: 1.2,
                                    ),
                                  ),
                                  enabledBorder: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(16),
                                    borderSide: BorderSide(
                                      color: _errorMessage != null
                                          ? theme.colorScheme.error
                                          : const Color(0xFFE2E8F0),
                                      width: 1.2,
                                    ),
                                  ),
                                  focusedBorder: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(16),
                                    borderSide: BorderSide(
                                      color: _errorMessage != null ? theme.colorScheme.error : const Color(0xFF2563EB),
                                      width: 1.2,
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ),

                          // Error message
                          if (_errorMessage != null) ...[
                            const SizedBox(height: 10),
                            Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Icon(
                                  Icons.error_outline_rounded,
                                  size: 15,
                                  color: theme.colorScheme.error,
                                ),
                                const SizedBox(width: 6),
                                Expanded(
                                  child: Text(
                                    _errorMessage!,
                                    style: GoogleFonts.plusJakartaSans(
                                      color: theme.colorScheme.error,
                                      fontSize: 12,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ],

                          const SizedBox(height: 12),

                          // Forgot password link
                          Align(
                            alignment: Alignment.centerRight,
                            child: TextButton(
                              onPressed: () {
                                HapticFeedback.lightImpact();
                                Navigator.of(context).push(
                                  MaterialPageRoute(
                                    builder: (_) => ForgotPasswordScreen(
                                      identifier: widget.identifier,
                                    ),
                                  ),
                                );
                              },
                              child: Text(
                                'Forgot password?',
                                style: GoogleFonts.plusJakartaSans(
                                  color: theme.colorScheme.primary,
                                  fontSize: 13,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ),
                          ),

                          const SizedBox(height: 12),

                          // Login Button
                          _LoginButton(
                            loading: _loading || _biometricChecking,
                            onPressed: _handleLogin,
                          ),

                          // Biometric Quick Sign-in Button
                          if (_hasBiometrics) ...[
                            const SizedBox(height: 20),
                            Center(
                              child: InkWell(
                                onTap: _loading || _biometricChecking
                                    ? null
                                    : () {
                                        HapticFeedback.lightImpact();
                                        _checkAndTriggerBiometrics(isManual: true);
                                      },
                                borderRadius: BorderRadius.circular(999),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 20,
                                    vertical: 11,
                                  ),
                                  decoration: BoxDecoration(
                                    color: isDark
                                        ? const Color(0xFF1E293B)
                                        : const Color(0xFFEFF6FF),
                                    borderRadius: BorderRadius.circular(999),
                                    border: Border.all(
                                      color: isDark
                                          ? const Color(0xFF334155)
                                          : const Color(0xFFBFDBFE),
                                      width: 1.2,
                                    ),
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Icon(
                                        _biometricIcon,
                                        size: 22,
                                        color: theme.colorScheme.primary,
                                      ),
                                      const SizedBox(width: 8),
                                      Text(
                                        'Sign in with $_biometricLabel',
                                        style: GoogleFonts.plusJakartaSans(
                                          fontSize: 14,
                                          fontWeight: FontWeight.w700,
                                          color: theme.colorScheme.primary,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ],
                    ),
                    const SizedBox(height: 32),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _LoginButton extends StatefulWidget {
  final bool loading;
  final VoidCallback onPressed;

  const _LoginButton({
    required this.loading,
    required this.onPressed,
  });

  @override
  State<_LoginButton> createState() => _LoginButtonState();
}

class _LoginButtonState extends State<_LoginButton> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    final brand = BrandConfig.current;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final borderRadius = BorderRadius.circular(brand.buttonRadius);
    final gradientColors = brand.buttonGradient;

    return GestureDetector(
      onTapDown: widget.loading ? null : (_) {
        HapticFeedback.heavyImpact();
        setState(() => _pressed = true);
      },
      onTapUp: widget.loading ? null : (_) => setState(() => _pressed = false),
      onTapCancel: () => setState(() => _pressed = false),
      onTap: widget.loading ? null : widget.onPressed,
      child: AnimatedScale(
        scale: _pressed ? 0.94 : 1.0,
        duration: const Duration(milliseconds: 120),
        curve: Curves.easeOutCubic,
        child: Container(
          width: double.infinity,
          height: 56,
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: gradientColors,
            ),
            borderRadius: borderRadius,
            boxShadow: [
              BoxShadow(
                color: gradientColors.first.withValues(alpha: isDark ? 0.4 : 0.28),
                blurRadius: 18,
                offset: const Offset(0, 6),
              ),
            ],
          ),
          alignment: Alignment.center,
          child: widget.loading
              ? SizedBox(
                  width: 22,
                  height: 22,
                  child: CircularProgressIndicator(
                    strokeWidth: 2.5,
                    valueColor: AlwaysStoppedAnimation<Color>(brand.onPrimaryColor),
                  ),
                )
              : Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      'Sign In',
                      style: GoogleFonts.plusJakartaSans(
                        color: brand.onPrimaryColor,
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 0.2,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Icon(
                      Icons.arrow_forward_rounded,
                      color: brand.onPrimaryColor,
                      size: 20,
                    ),
                  ],
                ),
        ),
      ),
    );
  }
}

