import '../config.dart';

import 'dart:async';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';

import '../services/transaction_pin_service.dart';
import '../state/session.dart';
import '../widgets/auth_liquid_glass.dart';
import '../widgets/state_select_sheet.dart';
import 'auth_password_screen.dart';
import 'shell_screen.dart';
import 'welcome_screen.dart';
import '../widgets/concentric_circles_bg.dart';

class SignupWizardScreen extends StatefulWidget {
  final String phone;

  const SignupWizardScreen({
    super.key,
    required this.phone,
  });

  static const String route = '/signup-wizard';

  @override
  State<SignupWizardScreen> createState() => _SignupWizardScreenState();
}

class _SignupWizardScreenState extends State<SignupWizardScreen> {
  final PageController _pageController = PageController();

  // Wizard Data in local state
  int _currentStep = 0; // 0: Password, 1: PIN, 2: Name/Email, 3: State
  final TextEditingController _passwordCtrl = TextEditingController();
  final TextEditingController _pinCtrl = TextEditingController();
  final TextEditingController _confirmPinCtrl = TextEditingController();
  final TextEditingController _nameCtrl = TextEditingController();
  final TextEditingController _emailCtrl = TextEditingController();
  final TextEditingController _referralCtrl = TextEditingController();
  String? _selectedState;

  final FocusNode _passwordFocus = FocusNode();
  final FocusNode _pinFocus = FocusNode();
  final FocusNode _confirmPinFocus = FocusNode();
  final FocusNode _nameFocus = FocusNode();
  final FocusNode _emailFocus = FocusNode();
  final FocusNode _referralFocus = FocusNode();
  final FocusNode _stateFocus = FocusNode();

  // UI state
  bool _obscurePassword = true;
  bool _obscurePin = true;
  bool _obscureConfirmPin = true;
  bool _showReferralField = false;
  bool _loading = false;
  String? _emailInlineError;
  String _stateSearchQuery = '';
  final GlobalKey<ShakeWidgetState> _shakeKey = GlobalKey<ShakeWidgetState>();

  @override
  void initState() {
    super.initState();
    _passwordFocus.addListener(() => setState(() {}));
    _pinFocus.addListener(() => setState(() {}));
    _confirmPinFocus.addListener(() => setState(() {}));
    _nameFocus.addListener(() => setState(() {}));
    _emailFocus.addListener(() => setState(() {}));
    _referralFocus.addListener(() => setState(() {}));
    _stateFocus.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _pageController.dispose();
    _passwordCtrl.dispose();
    _pinCtrl.dispose();
    _confirmPinCtrl.dispose();
    _nameCtrl.dispose();
    _emailCtrl.dispose();
    _referralCtrl.dispose();
    _passwordFocus.dispose();
    _pinFocus.dispose();
    _confirmPinFocus.dispose();
    _nameFocus.dispose();
    _emailFocus.dispose();
    _referralFocus.dispose();
    _stateFocus.dispose();
    super.dispose();
  }

  bool _isEmailValid(String email) {
    final trimmed = email.trim();
    if (trimmed.isEmpty) return false;
    final regex = RegExp(r'^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+$');
    return regex.hasMatch(trimmed);
  }

  int _calculatePasswordStrength(String pass) {
    if (pass.isEmpty) return 0;
    int strength = 0;
    if (pass.length >= 8) strength++;
    if (pass.contains(RegExp(r'[0-9]'))) strength++;
    if (pass.contains(RegExp(r'[A-Za-z]'))) strength++;
    if (pass.length >= 10 || pass.contains(RegExp(r'[!@#\$%^&*(),.?":{}|<>]'))) strength++;
    return strength; // 0 to 4
  }

  void _nextStep() {
    FocusScope.of(context).unfocus();
    HapticFeedback.lightImpact();

    _pageController.nextPage(
      duration: const Duration(milliseconds: 320),
      curve: Curves.easeOutCubic,
    );
  }

  void _previousStep() {
    FocusScope.of(context).unfocus();
    HapticFeedback.lightImpact();

    if (_currentStep == 0) {
      // Step 1 back -> Return to WelcomeScreen keeping phone prefilled
      Navigator.of(context).pushAndRemoveUntil(
        PageRouteBuilder(
          pageBuilder: (context, animation, secondaryAnimation) =>
              WelcomeScreen(initialPhone: widget.phone),
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
    } else {
      _pageController.previousPage(
        duration: const Duration(milliseconds: 320),
        curve: Curves.easeOutCubic,
      );
    }
  }

  Future<void> _submitRegistration({bool requestPush = true}) async {
    if (_loading) return;

    setState(() {
      _loading = true;
      _emailInlineError = null;
    });

    HapticFeedback.mediumImpact();

    final session = context.read<SessionController>();
    final cleanEmail = _emailCtrl.text.trim().toLowerCase();
    final cleanName = _nameCtrl.text.trim();
    final cleanPass = _passwordCtrl.text;
    final cleanPin = _pinCtrl.text.trim();
    final cleanReferral = _referralCtrl.text.trim();

    try {
      final ok = await session.register(
        cleanName,
        cleanEmail,
        widget.phone,
        cleanPass,
        referralCode: cleanReferral.isNotEmpty ? cleanReferral : null,
        state: _selectedState,
        pin: cleanPin,
      );

      if (!mounted) return;

      if (ok) {
        // Guarantee PIN is saved via TransactionPinService if Render backend hasn't deployed register with pin yet
        if (cleanPin.isNotEmpty && session.token != null) {
          try {
            await TransactionPinService(token: session.token!).setup(
              pin: cleanPin,
              confirmPin: cleanPin,
            );
          } catch (_) {}
        }

        // Trigger built-in system notification prompt directly
        if (requestPush) {
          try {
            if (Firebase.apps.isNotEmpty) {
              await FirebaseMessaging.instance.requestPermission(
                alert: true,
                badge: true,
                sound: true,
              );
            }
          } catch (_) {}
        }

        if (!mounted) return;
        HapticFeedback.mediumImpact();
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
        return;
      }

      // Registration failed
      _handleRegistrationError(session.error ?? 'Registration failed');
    } catch (e) {
      if (!mounted) return;
      _handleRegistrationError(e.toString());
    } finally {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  void _handleRegistrationError(String rawError) {
    HapticFeedback.heavyImpact();
    final lower = rawError.toLowerCase();

    if (lower.contains('email already') || lower.contains('email_already') || (lower.contains('email') && lower.contains('registered'))) {
      _emailInlineError = 'This email is already in use. Please enter a different email address.';
      _pageController.animateToPage(
        2,
        duration: const Duration(milliseconds: 360),
        curve: Curves.easeOutCubic,
      );
      _shakeKey.currentState?.shake();
      return;
    }

    if (lower.contains('phone number already') || lower.contains('phone_number already')) {
      showDialog(
        context: context,
        builder: (ctx) => AlertDialog(
          backgroundColor: const Color(0xFF0F172A),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: Text('Account Exists', style: GoogleFonts.plusJakartaSans(color: Colors.white, fontWeight: FontWeight.w700)),
          content: Text(
            'The phone number ${widget.phone} is already registered. Would you like to log in?',
            style: GoogleFonts.plusJakartaSans(color: Colors.white70),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(),
              child: Text('Cancel', style: GoogleFonts.plusJakartaSans(color: Colors.white60)),
            ),
            ElevatedButton(
              onPressed: () {
                Navigator.of(ctx).pop();
                Navigator.of(context).pushReplacement(
                  MaterialPageRoute(
                    builder: (_) => AuthPasswordScreen(identifier: widget.phone),
                  ),
                );
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF0B4FD2),
                foregroundColor: Colors.white,
              ),
              child: const Text('Go to Login'),
            ),
          ],
        ),
      );
      return;
    }

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(rawError.isNotEmpty ? rawError : 'Unable to complete signup. Please check your connection and try again.'),
        backgroundColor: const Color(0xFFE11D48),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final brand = BrandConfig.current;

    return Scaffold(
      body: AnnotatedRegion<SystemUiOverlayStyle>(
        value: isDark ? SystemUiOverlayStyle.light : SystemUiOverlayStyle.dark,
        child: ConcentricCirclesBg(
          child: SafeArea(
            bottom: false,
            child: Column(
              children: [
                // Top App Bar
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  child: Row(
                    children: [
                      IconButton(
                        onPressed: _previousStep,
                        icon: Icon(
                          Icons.arrow_back_ios_new_rounded,
                          color: isDark ? Colors.white : const Color(0xFF0F172A),
                          size: 20,
                        ),
                      ),
                      const Spacer(),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                        decoration: BoxDecoration(
                          color: isDark ? Colors.white.withValues(alpha: 0.08) : const Color(0xFFF1F5F9),
                          borderRadius: BorderRadius.circular(999),
                        ),
                        child: Text(
                          'Step ${_currentStep + 1} of 4',
                          style: GoogleFonts.plusJakartaSans(
                            color: brand.primaryColor,
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                            letterSpacing: 0.3,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                    ],
                  ),
                ),

                // 4-Segment Progress Bar
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 6),
                  child: Row(
                    children: List.generate(4, (index) {
                      final isCompleted = index <= _currentStep;
                      return Expanded(
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 300),
                          curve: Curves.easeOutCubic,
                          height: 4,
                          margin: EdgeInsets.only(right: index < 3 ? 6 : 0),
                          decoration: BoxDecoration(
                            gradient: isCompleted
                                ? LinearGradient(
                                    colors: brand.buttonGradient,
                                    begin: Alignment.centerLeft,
                                    end: Alignment.centerRight,
                                  )
                                : null,
                            color: isCompleted
                                ? null
                                : (isDark ? Colors.white.withValues(alpha: 0.12) : const Color(0xFFE2E8F0)),
                            borderRadius: BorderRadius.circular(2),
                          ),
                        ),
                      );
                    }),
                  ),
                ),

                const SizedBox(height: 8),

                // PageView Steps
                Expanded(
                  child: PageView(
                    controller: _pageController,
                    physics: const NeverScrollableScrollPhysics(),
                    onPageChanged: (page) => setState(() => _currentStep = page),
                    children: [
                      _buildStep1Password(isDark),
                      _buildStep2Pin(isDark),
                      _buildStep3NameAndEmail(isDark),
                      _buildStep4State(isDark),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // ----------------------------------------------------
  // Step 1: Create Password
  // ----------------------------------------------------
  Widget _buildStep1Password(bool isDark) {
    final theme = Theme.of(context);
    final password = _passwordCtrl.text;
    final isValid = password.length >= 8;
    final strength = _calculatePasswordStrength(password);

    String strengthLabel = 'Weak';
    Color strengthColor = const Color(0xFFEF4444);
    if (strength == 2) {
      strengthLabel = 'Fair';
      strengthColor = const Color(0xFFF59E0B);
    } else if (strength == 3) {
      strengthLabel = 'Good';
      strengthColor = const Color(0xFF2563EB);
    } else if (strength >= 4) {
      strengthLabel = 'Strong';
      strengthColor = const Color(0xFF10B981);
    }

    return Column(
      children: [
        Expanded(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
            keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header Title
                Text(
                  'Create password',
                  style: GoogleFonts.plusJakartaSans(
                    color: isDark ? Colors.white : const Color(0xFF0F172A),
                    fontSize: 28,
                    fontWeight: FontWeight.w800,
                    letterSpacing: -0.6,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  'Choose a secure password to protect your ${AppConfig.appName} wallet and transactions.',
                  style: GoogleFonts.plusJakartaSans(
                    color: isDark ? Colors.white.withValues(alpha: 0.7) : const Color(0xFF64748B),
                    fontSize: 14,
                    height: 1.45,
                  ),
                ),
                const SizedBox(height: 18),

                // Phone Pill
                PhonePill(
                  phone: widget.phone,
                  onChange: () {
                    Navigator.of(context).pushAndRemoveUntil(
                      PageRouteBuilder(
                        pageBuilder: (context, animation, secondaryAnimation) =>
                            WelcomeScreen(initialPhone: widget.phone),
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
                  },
                ),
                const SizedBox(height: 28),

                // Label
                Padding(
                  padding: const EdgeInsets.only(bottom: 8, left: 4),
                  child: Text(
                    'PASSWORD',
                    style: GoogleFonts.plusJakartaSans(
                      color: theme.colorScheme.primary,
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
                      color: isDark ? const Color(0xFF131B2E) : Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: _passwordFocus.hasFocus
                            ? const Color(0xFF0B4FD2)
                            : (isDark ? Colors.white12 : const Color(0xFFE2E8F0)),
                        width: _passwordFocus.hasFocus ? 1.5 : 1.2,
                      ),
                      boxShadow: _passwordFocus.hasFocus
                          ? [
                              BoxShadow(
                                color: const Color(0xFF0B4FD2).withValues(alpha: isDark ? 0.3 : 0.14),
                                blurRadius: 14,
                                offset: const Offset(0, 4),
                              ),
                            ]
                          : [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: isDark ? 0.15 : 0.03),
                                blurRadius: 8,
                                offset: const Offset(0, 2),
                              ),
                            ],
                    ),
                    child: TextField(
                      controller: _passwordCtrl,
                      focusNode: _passwordFocus,
                      obscureText: _obscurePassword,
                      autofocus: true,
                      onChanged: (_) => setState(() {}),
                      onSubmitted: (_) {
                        if (isValid) _nextStep();
                      },
                      style: GoogleFonts.plusJakartaSans(
                        color: isDark ? Colors.white : const Color(0xFF0F172A),
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                      cursorColor: const Color(0xFF0B4FD2),
                      decoration: InputDecoration(
                        hintText: 'Enter at least 8 characters',
                        hintStyle: GoogleFonts.plusJakartaSans(
                          color: isDark ? Colors.white.withValues(alpha: 0.35) : const Color(0xFF94A3B8),
                          fontSize: 14,
                        ),
                        prefixIcon: Icon(
                          Icons.lock_outline_rounded,
                          size: 20,
                          color: _passwordFocus.hasFocus
                              ? const Color(0xFF0B4FD2)
                              : (isDark ? Colors.white54 : const Color(0xFF64748B)),
                        ),
                        suffixIcon: IconButton(
                          onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                          icon: Icon(
                            _obscurePassword ? Icons.visibility_off_rounded : Icons.visibility_rounded,
                            color: isDark ? Colors.white54 : const Color(0xFF64748B),
                            size: 20,
                          ),
                        ),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                        border: InputBorder.none,
                        enabledBorder: InputBorder.none,
                        focusedBorder: InputBorder.none,
                        errorBorder: InputBorder.none,
                        focusedErrorBorder: InputBorder.none,
                        disabledBorder: InputBorder.none,
                        filled: false,
                      ),
                    ),
                  ),
                ),

                const SizedBox(height: 16),

                // Interactive Password Strength Meter
                if (password.isNotEmpty) ...[
                  Row(
                    children: [
                      Text(
                        'Password strength: ',
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                          color: isDark ? Colors.white60 : const Color(0xFF64748B),
                        ),
                      ),
                      Text(
                        strengthLabel,
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                          color: strengthColor,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: List.generate(4, (idx) {
                      final filled = idx < strength;
                      return Expanded(
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 250),
                          height: 4,
                          margin: EdgeInsets.only(right: idx < 3 ? 6 : 0),
                          decoration: BoxDecoration(
                            color: filled ? strengthColor : (isDark ? Colors.white12 : const Color(0xFFE2E8F0)),
                            borderRadius: BorderRadius.circular(2),
                          ),
                        ),
                      );
                    }),
                  ),
                  const SizedBox(height: 14),
                ],

                // Criteria Checklist
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    _buildRequirementChip(
                      label: '8+ characters',
                      met: password.length >= 8,
                      isDark: isDark,
                    ),
                    _buildRequirementChip(
                      label: '1+ number',
                      met: password.contains(RegExp(r'[0-9]')),
                      isDark: isDark,
                    ),
                    _buildRequirementChip(
                      label: 'Letters',
                      met: password.contains(RegExp(r'[A-Za-z]')),
                      isDark: isDark,
                    ),
                  ],
                ),

                const SizedBox(height: 24),

                // Bank-grade encryption badge
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.lock_rounded,
                      size: 14,
                      color: isDark ? Colors.white38 : const Color(0xFF94A3B8),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      'Protected by 256-bit bank-grade encryption',
                      style: GoogleFonts.plusJakartaSans(
                        color: isDark ? Colors.white38 : const Color(0xFF94A3B8),
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
              ],
            ),
          ),
        ),

        // Pinned Bottom Button
        SafeArea(
          top: false,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(24, 8, 24, 16),
            child: _WizardActionButton(
              label: 'Continue',
              enabled: isValid,
              onPressed: () {
                if (isValid) {
                  _nextStep();
                } else {
                  HapticFeedback.heavyImpact();
                  _shakeKey.currentState?.shake();
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Please enter at least 8 characters for your password.'),
                      duration: Duration(seconds: 2),
                      behavior: SnackBarBehavior.floating,
                    ),
                  );
                }
              },
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildRequirementChip({
    required String label,
    required bool met,
    required bool isDark,
  }) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: met
            ? const Color(0xFF10B981).withValues(alpha: isDark ? 0.15 : 0.10)
            : (isDark ? Colors.white.withValues(alpha: 0.05) : const Color(0xFFF1F5F9)),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: met
              ? const Color(0xFF10B981).withValues(alpha: 0.4)
              : (isDark ? Colors.white12 : const Color(0xFFE2E8F0)),
          width: 1,
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            met ? Icons.check_circle_rounded : Icons.radio_button_unchecked_rounded,
            size: 13,
            color: met ? const Color(0xFF10B981) : (isDark ? Colors.white38 : const Color(0xFF94A3B8)),
          ),
          const SizedBox(width: 5),
          Text(
            label,
            style: GoogleFonts.plusJakartaSans(
              fontSize: 12,
              fontWeight: met ? FontWeight.w700 : FontWeight.w500,
              color: met
                  ? (isDark ? const Color(0xFF34D399) : const Color(0xFF059669))
                  : (isDark ? Colors.white60 : const Color(0xFF64748B)),
            ),
          ),
        ],
      ),
    );
  }

  // ----------------------------------------------------
  // Step 2: Set Transaction PIN
  // ----------------------------------------------------
  Widget _buildStep2Pin(bool isDark) {
    final theme = Theme.of(context);
    final pin = _pinCtrl.text.trim();
    final confirm = _confirmPinCtrl.text.trim();
    final isPinValid = pin.length == 4;
    final isMatch = isPinValid && pin == confirm;
    final showMismatch = confirm.length == 4 && !isMatch;

    return Column(
      children: [
        Expanded(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
            keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Set transaction PIN',
                  style: GoogleFonts.plusJakartaSans(
                    color: isDark ? Colors.white : const Color(0xFF0F172A),
                    fontSize: 28,
                    fontWeight: FontWeight.w800,
                    letterSpacing: -0.6,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  'Create a 4-digit numeric PIN for authorizing purchases and wallet transfers.',
                  style: GoogleFonts.plusJakartaSans(
                    color: isDark ? Colors.white.withValues(alpha: 0.7) : const Color(0xFF64748B),
                    fontSize: 14,
                    height: 1.45,
                  ),
                ),
                const SizedBox(height: 18),

                PhonePill(
                  phone: widget.phone,
                  onChange: () {
                    Navigator.of(context).pushAndRemoveUntil(
                      PageRouteBuilder(
                        pageBuilder: (context, animation, secondaryAnimation) =>
                            WelcomeScreen(initialPhone: widget.phone),
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
                  },
                ),
                const SizedBox(height: 28),

                // PIN Label
                Padding(
                  padding: const EdgeInsets.only(bottom: 8, left: 4),
                  child: Text(
                    'NEW 4-DIGIT PIN',
                    style: GoogleFonts.plusJakartaSans(
                      color: theme.colorScheme.primary,
                      fontSize: 11,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 1.2,
                    ),
                  ),
                ),
                AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  height: 56,
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF131B2E) : Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: _pinFocus.hasFocus
                          ? const Color(0xFF0B4FD2)
                          : (isDark ? Colors.white12 : const Color(0xFFE2E8F0)),
                      width: _pinFocus.hasFocus ? 1.5 : 1.2,
                    ),
                    boxShadow: _pinFocus.hasFocus
                        ? [
                            BoxShadow(
                              color: const Color(0xFF0B4FD2).withValues(alpha: isDark ? 0.3 : 0.14),
                              blurRadius: 14,
                              offset: const Offset(0, 4),
                            ),
                          ]
                        : [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: isDark ? 0.15 : 0.03),
                              blurRadius: 8,
                              offset: const Offset(0, 2),
                            ),
                          ],
                  ),
                  child: TextField(
                    controller: _pinCtrl,
                    focusNode: _pinFocus,
                    keyboardType: TextInputType.number,
                    obscureText: _obscurePin,
                    maxLength: 4,
                    inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                    onChanged: (val) {
                      setState(() {});
                      if (val.length == 4) {
                        _confirmPinFocus.requestFocus();
                      }
                    },
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 22,
                      fontWeight: FontWeight.w900,
                      color: isDark ? Colors.white : const Color(0xFF0F172A),
                      letterSpacing: 8,
                    ),
                    cursorColor: const Color(0xFF0B4FD2),
                    decoration: InputDecoration(
                      counterText: '',
                      hintText: '••••',
                      hintStyle: GoogleFonts.plusJakartaSans(
                        color: isDark ? Colors.white24 : const Color(0xFF94A3B8),
                        letterSpacing: 8,
                      ),
                      prefixIcon: Icon(
                        Icons.pin_rounded,
                        size: 20,
                        color: _pinFocus.hasFocus
                            ? const Color(0xFF0B4FD2)
                            : (isDark ? Colors.white54 : const Color(0xFF64748B)),
                      ),
                      suffixIcon: IconButton(
                        icon: Icon(
                          _obscurePin ? Icons.visibility_off_rounded : Icons.visibility_rounded,
                          color: isDark ? Colors.white54 : const Color(0xFF64748B),
                        ),
                        onPressed: () => setState(() => _obscurePin = !_obscurePin),
                      ),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      border: InputBorder.none,
                      enabledBorder: InputBorder.none,
                      focusedBorder: InputBorder.none,
                      errorBorder: InputBorder.none,
                      focusedErrorBorder: InputBorder.none,
                      disabledBorder: InputBorder.none,
                      filled: false,
                    ),
                  ),
                ),

                const SizedBox(height: 20),

                // Confirm PIN Label
                Padding(
                  padding: const EdgeInsets.only(bottom: 8, left: 4),
                  child: Text(
                    'CONFIRM 4-DIGIT PIN',
                    style: GoogleFonts.plusJakartaSans(
                      color: theme.colorScheme.primary,
                      fontSize: 11,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 1.2,
                    ),
                  ),
                ),
                AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  height: 56,
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF131B2E) : Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: showMismatch
                          ? const Color(0xFFEF4444)
                          : _confirmPinFocus.hasFocus
                              ? const Color(0xFF0B4FD2)
                              : (isDark ? Colors.white12 : const Color(0xFFE2E8F0)),
                      width: _confirmPinFocus.hasFocus || showMismatch ? 1.5 : 1.2,
                    ),
                    boxShadow: _confirmPinFocus.hasFocus
                        ? [
                            BoxShadow(
                              color: const Color(0xFF0B4FD2).withValues(alpha: isDark ? 0.3 : 0.14),
                              blurRadius: 14,
                              offset: const Offset(0, 4),
                            ),
                          ]
                        : [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: isDark ? 0.15 : 0.03),
                              blurRadius: 8,
                              offset: const Offset(0, 2),
                            ),
                          ],
                  ),
                  child: TextField(
                    controller: _confirmPinCtrl,
                    focusNode: _confirmPinFocus,
                    keyboardType: TextInputType.number,
                    obscureText: _obscureConfirmPin,
                    maxLength: 4,
                    inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                    onChanged: (_) => setState(() {}),
                    onSubmitted: (_) {
                      if (isMatch) _nextStep();
                    },
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 22,
                      fontWeight: FontWeight.w900,
                      color: isDark ? Colors.white : const Color(0xFF0F172A),
                      letterSpacing: 8,
                    ),
                    cursorColor: const Color(0xFF0B4FD2),
                    decoration: InputDecoration(
                      counterText: '',
                      hintText: '••••',
                      hintStyle: GoogleFonts.plusJakartaSans(
                        color: isDark ? Colors.white24 : const Color(0xFF94A3B8),
                        letterSpacing: 8,
                      ),
                      prefixIcon: Icon(
                        Icons.pin_rounded,
                        size: 20,
                        color: _confirmPinFocus.hasFocus
                            ? const Color(0xFF0B4FD2)
                            : (isDark ? Colors.white54 : const Color(0xFF64748B)),
                      ),
                      suffixIcon: IconButton(
                        icon: Icon(
                          _obscureConfirmPin ? Icons.visibility_off_rounded : Icons.visibility_rounded,
                          color: isDark ? Colors.white54 : const Color(0xFF64748B),
                        ),
                        onPressed: () => setState(() => _obscureConfirmPin = !_obscureConfirmPin),
                      ),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      border: InputBorder.none,
                      enabledBorder: InputBorder.none,
                      focusedBorder: InputBorder.none,
                      errorBorder: InputBorder.none,
                      focusedErrorBorder: InputBorder.none,
                      disabledBorder: InputBorder.none,
                      filled: false,
                    ),
                  ),
                ),

                const SizedBox(height: 10),

                // Match Status Feedback
                if (showMismatch)
                  Row(
                    children: [
                      const Icon(Icons.error_outline_rounded, color: Color(0xFFEF4444), size: 15),
                      const SizedBox(width: 6),
                      Text(
                        'PINs do not match. Please verify both inputs.',
                        style: GoogleFonts.plusJakartaSans(
                          color: const Color(0xFFEF4444),
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  )
                else if (isMatch)
                  Row(
                    children: [
                      const Icon(Icons.check_circle_rounded, color: Color(0xFF10B981), size: 15),
                      const SizedBox(width: 6),
                      Text(
                        'PINs match successfully',
                        style: GoogleFonts.plusJakartaSans(
                          color: const Color(0xFF10B981),
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),

                const SizedBox(height: 24),
              ],
            ),
          ),
        ),

        // Pinned Bottom Button
        SafeArea(
          top: false,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(24, 8, 24, 16),
            child: _WizardActionButton(
              label: 'Continue',
              enabled: isMatch,
              onPressed: () {
                if (isMatch) {
                  _nextStep();
                } else if (!isPinValid) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Please enter a 4-digit numeric PIN.'),
                      duration: Duration(seconds: 2),
                      behavior: SnackBarBehavior.floating,
                    ),
                  );
                } else {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('PIN confirmation does not match.'),
                      duration: Duration(seconds: 2),
                      behavior: SnackBarBehavior.floating,
                    ),
                  );
                }
              },
            ),
          ),
        ),
      ],
    );
  }

  // ----------------------------------------------------
  // Step 3: Name & Email
  // ----------------------------------------------------
  Widget _buildStep3NameAndEmail(bool isDark) {
    final theme = Theme.of(context);
    final name = _nameCtrl.text.trim();
    final email = _emailCtrl.text.trim();
    final isNameValid = name.length >= 2;
    final isEmailFormatValid = _isEmailValid(email);
    final canContinue = isNameValid && isEmailFormatValid;

    return Column(
      children: [
        Expanded(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
            keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  "What's your name?",
                  style: GoogleFonts.plusJakartaSans(
                    color: isDark ? Colors.white : const Color(0xFF0F172A),
                    fontSize: 28,
                    fontWeight: FontWeight.w800,
                    letterSpacing: -0.6,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  'We use your name and email for your official transaction receipts and password recovery.',
                  style: GoogleFonts.plusJakartaSans(
                    color: isDark ? Colors.white.withValues(alpha: 0.7) : const Color(0xFF64748B),
                    fontSize: 14,
                    height: 1.45,
                  ),
                ),
                const SizedBox(height: 24),

                // Full Name Label
                Padding(
                  padding: const EdgeInsets.only(bottom: 8, left: 4),
                  child: Text(
                    'FULL NAME',
                    style: GoogleFonts.plusJakartaSans(
                      color: theme.colorScheme.primary,
                      fontSize: 11,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 1.2,
                    ),
                  ),
                ),
                AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  height: 56,
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF131B2E) : Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: _nameFocus.hasFocus
                          ? const Color(0xFF0B4FD2)
                          : (isDark ? Colors.white12 : const Color(0xFFE2E8F0)),
                      width: _nameFocus.hasFocus ? 1.5 : 1.2,
                    ),
                    boxShadow: _nameFocus.hasFocus
                        ? [
                            BoxShadow(
                              color: const Color(0xFF0B4FD2).withValues(alpha: isDark ? 0.3 : 0.14),
                              blurRadius: 14,
                              offset: const Offset(0, 4),
                            ),
                          ]
                        : [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: isDark ? 0.15 : 0.03),
                              blurRadius: 8,
                              offset: const Offset(0, 2),
                            ),
                          ],
                  ),
                  child: TextField(
                    controller: _nameCtrl,
                    focusNode: _nameFocus,
                    textCapitalization: TextCapitalization.words,
                    onChanged: (_) => setState(() {}),
                    style: GoogleFonts.plusJakartaSans(
                      color: isDark ? Colors.white : const Color(0xFF0F172A),
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                    cursorColor: const Color(0xFF0B4FD2),
                    decoration: InputDecoration(
                      hintText: 'Enter your full name',
                      hintStyle: GoogleFonts.plusJakartaSans(
                        color: isDark ? Colors.white.withValues(alpha: 0.35) : const Color(0xFF94A3B8),
                        fontSize: 14,
                      ),
                      prefixIcon: Icon(
                        Icons.person_outline_rounded,
                        size: 20,
                        color: _nameFocus.hasFocus
                            ? const Color(0xFF0B4FD2)
                            : (isDark ? Colors.white54 : const Color(0xFF64748B)),
                      ),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                      border: InputBorder.none,
                      enabledBorder: InputBorder.none,
                      focusedBorder: InputBorder.none,
                      errorBorder: InputBorder.none,
                      focusedErrorBorder: InputBorder.none,
                      disabledBorder: InputBorder.none,
                      filled: false,
                    ),
                  ),
                ),

                const SizedBox(height: 20),

                // Email Label
                Padding(
                  padding: const EdgeInsets.only(bottom: 8, left: 4),
                  child: Text(
                    'EMAIL ADDRESS',
                    style: GoogleFonts.plusJakartaSans(
                      color: theme.colorScheme.primary,
                      fontSize: 11,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 1.2,
                    ),
                  ),
                ),
                AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  height: 56,
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF131B2E) : Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: _emailInlineError != null
                          ? const Color(0xFFEF4444)
                          : _emailFocus.hasFocus
                              ? const Color(0xFF0B4FD2)
                              : (isDark ? Colors.white12 : const Color(0xFFE2E8F0)),
                      width: _emailFocus.hasFocus || _emailInlineError != null ? 1.5 : 1.2,
                    ),
                    boxShadow: _emailFocus.hasFocus
                        ? [
                            BoxShadow(
                              color: const Color(0xFF0B4FD2).withValues(alpha: isDark ? 0.3 : 0.14),
                              blurRadius: 14,
                              offset: const Offset(0, 4),
                            ),
                          ]
                        : [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: isDark ? 0.15 : 0.03),
                              blurRadius: 8,
                              offset: const Offset(0, 2),
                            ),
                          ],
                  ),
                  child: TextField(
                    controller: _emailCtrl,
                    focusNode: _emailFocus,
                    keyboardType: TextInputType.emailAddress,
                    autocorrect: false,
                    onChanged: (_) {
                      if (_emailInlineError != null) {
                        setState(() => _emailInlineError = null);
                      } else {
                        setState(() {});
                      }
                    },
                    onSubmitted: (_) {
                      if (canContinue) _nextStep();
                    },
                    style: GoogleFonts.plusJakartaSans(
                      color: isDark ? Colors.white : const Color(0xFF0F172A),
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                    cursorColor: const Color(0xFF0B4FD2),
                    decoration: InputDecoration(
                      hintText: 'e.g. name@example.com',
                      hintStyle: GoogleFonts.plusJakartaSans(
                        color: isDark ? Colors.white.withValues(alpha: 0.35) : const Color(0xFF94A3B8),
                        fontSize: 14,
                      ),
                      prefixIcon: Icon(
                        Icons.mail_outline_rounded,
                        size: 20,
                        color: _emailFocus.hasFocus
                            ? const Color(0xFF0B4FD2)
                            : (isDark ? Colors.white54 : const Color(0xFF64748B)),
                      ),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                      border: InputBorder.none,
                      enabledBorder: InputBorder.none,
                      focusedBorder: InputBorder.none,
                      errorBorder: InputBorder.none,
                      focusedErrorBorder: InputBorder.none,
                      disabledBorder: InputBorder.none,
                      filled: false,
                    ),
                  ),
                ),

                if (_emailInlineError != null) ...[
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      const Icon(Icons.error_outline_rounded, color: Color(0xFFEF4444), size: 14),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          _emailInlineError!,
                          style: GoogleFonts.plusJakartaSans(
                            color: const Color(0xFFEF4444),
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],

                const SizedBox(height: 20),

                // Referral Section (Optional)
                if (!_showReferralField)
                  InkWell(
                    onTap: () => setState(() => _showReferralField = true),
                    borderRadius: BorderRadius.circular(8),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 4),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.card_giftcard_rounded, size: 16, color: theme.colorScheme.primary),
                          const SizedBox(width: 8),
                          Text(
                            'Have a referral code? (Optional)',
                            style: GoogleFonts.plusJakartaSans(
                              color: theme.colorScheme.primary,
                              fontSize: 13,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ],
                      ),
                    ),
                  )
                else ...[
                  Padding(
                    padding: const EdgeInsets.only(bottom: 8, left: 4),
                    child: Text(
                      'REFERRAL CODE (OPTIONAL)',
                      style: GoogleFonts.plusJakartaSans(
                        color: isDark ? Colors.white60 : const Color(0xFF64748B),
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 1.1,
                      ),
                    ),
                  ),
                  AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    height: 56,
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF131B2E) : Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: _referralFocus.hasFocus
                            ? const Color(0xFF0B4FD2)
                            : (isDark ? Colors.white12 : const Color(0xFFE2E8F0)),
                        width: _referralFocus.hasFocus ? 1.5 : 1.2,
                      ),
                    ),
                    child: TextField(
                      controller: _referralCtrl,
                      focusNode: _referralFocus,
                      textCapitalization: TextCapitalization.characters,
                      style: GoogleFonts.plusJakartaSans(
                        color: isDark ? Colors.white : const Color(0xFF0F172A),
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                      cursorColor: const Color(0xFF0B4FD2),
                      decoration: InputDecoration(
                        hintText: 'Enter referral code',
                        hintStyle: GoogleFonts.plusJakartaSans(
                          color: isDark ? Colors.white.withValues(alpha: 0.35) : const Color(0xFF94A3B8),
                          fontSize: 14,
                        ),
                        prefixIcon: Icon(
                          Icons.card_giftcard_rounded,
                          size: 20,
                          color: _referralFocus.hasFocus
                              ? const Color(0xFF0B4FD2)
                              : (isDark ? Colors.white54 : const Color(0xFF64748B)),
                        ),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                        border: InputBorder.none,
                        enabledBorder: InputBorder.none,
                        focusedBorder: InputBorder.none,
                        errorBorder: InputBorder.none,
                        focusedErrorBorder: InputBorder.none,
                        disabledBorder: InputBorder.none,
                        filled: false,
                      ),
                    ),
                  ),
                ],

                const SizedBox(height: 24),
              ],
            ),
          ),
        ),

        // Pinned Bottom Button
        SafeArea(
          top: false,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(24, 8, 24, 16),
            child: _WizardActionButton(
              label: 'Continue',
              enabled: canContinue,
              onPressed: () {
                if (canContinue) {
                  _nextStep();
                } else if (!isNameValid) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Please enter your full name.'),
                      duration: Duration(seconds: 2),
                      behavior: SnackBarBehavior.floating,
                    ),
                  );
                } else {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Please enter a valid email address.'),
                      duration: Duration(seconds: 2),
                      behavior: SnackBarBehavior.floating,
                    ),
                  );
                }
              },
            ),
          ),
        ),
      ],
    );
  }

  // ----------------------------------------------------
  // Step 4: Select State
  // ----------------------------------------------------
  Widget _buildStep4State(bool isDark) {
    final filtered = _stateSearchQuery.isEmpty
        ? kNigerianStates
        : kNigerianStates.where((s) => s.toLowerCase().contains(_stateSearchQuery.toLowerCase())).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Select your state',
                style: GoogleFonts.plusJakartaSans(
                  color: isDark ? Colors.white : const Color(0xFF0F172A),
                  fontSize: 28,
                  fontWeight: FontWeight.w800,
                  letterSpacing: -0.6,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                'Choose your state of residence. Required for localized telecom bundle routing.',
                style: GoogleFonts.plusJakartaSans(
                  color: isDark ? Colors.white.withValues(alpha: 0.7) : const Color(0xFF64748B),
                  fontSize: 14,
                  height: 1.45,
                ),
              ),
              const SizedBox(height: 16),

              // Search bar
              AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                height: 52,
                padding: const EdgeInsets.symmetric(horizontal: 14),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF131B2E) : Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: _stateFocus.hasFocus
                        ? const Color(0xFF0B4FD2)
                        : (isDark ? Colors.white12 : const Color(0xFFE2E8F0)),
                    width: _stateFocus.hasFocus ? 1.5 : 1.2,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: isDark ? 0.15 : 0.03),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    Icon(
                      Icons.search_rounded,
                      size: 20,
                      color: _stateFocus.hasFocus
                          ? const Color(0xFF0B4FD2)
                          : (isDark ? Colors.white54 : const Color(0xFF64748B)),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: TextField(
                        focusNode: _stateFocus,
                        onChanged: (q) => setState(() => _stateSearchQuery = q),
                        style: GoogleFonts.plusJakartaSans(
                          color: isDark ? Colors.white : const Color(0xFF0F172A),
                          fontSize: 14,
                          fontWeight: FontWeight.w500,
                        ),
                        cursorColor: const Color(0xFF0B4FD2),
                        decoration: InputDecoration(
                          hintText: 'Search state (e.g. Lagos, Borno, Kano)...',
                          hintStyle: GoogleFonts.plusJakartaSans(
                            color: isDark ? Colors.white.withValues(alpha: 0.35) : const Color(0xFF94A3B8),
                            fontSize: 14,
                          ),
                          border: InputBorder.none,
                          enabledBorder: InputBorder.none,
                          focusedBorder: InputBorder.none,
                          errorBorder: InputBorder.none,
                          focusedErrorBorder: InputBorder.none,
                          disabledBorder: InputBorder.none,
                          filled: false,
                          isDense: true,
                        ),
                      ),
                    ),
                    if (_stateSearchQuery.isNotEmpty)
                      GestureDetector(
                        onTap: () => setState(() => _stateSearchQuery = ''),
                        child: Icon(
                          Icons.cancel_rounded,
                          size: 18,
                          color: isDark ? Colors.white38 : const Color(0xFF94A3B8),
                        ),
                      ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),

        // State List
        Expanded(
          child: ListView.builder(
            itemCount: filtered.length,
            padding: const EdgeInsets.symmetric(horizontal: 24),
            itemBuilder: (context, idx) {
              final stateName = filtered[idx];
              final isSelected = _selectedState == stateName;
              return InkWell(
                onTap: () {
                  HapticFeedback.selectionClick();
                  setState(() => _selectedState = stateName);
                },
                borderRadius: BorderRadius.circular(14),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                  margin: const EdgeInsets.only(bottom: 8),
                  decoration: BoxDecoration(
                    color: isSelected
                        ? const Color(0xFF0B4FD2).withValues(alpha: isDark ? 0.22 : 0.08)
                        : (isDark ? const Color(0xFF131B2E) : Colors.white),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: isSelected
                          ? const Color(0xFF0B4FD2)
                          : (isDark ? Colors.white.withValues(alpha: 0.08) : const Color(0xFFE2E8F0)),
                      width: isSelected ? 1.5 : 1.0,
                    ),
                    boxShadow: isDark || isSelected
                        ? null
                        : [
                            BoxShadow(
                              color: const Color(0xFF94A3B8).withValues(alpha: 0.06),
                              blurRadius: 4,
                              offset: const Offset(0, 1),
                            ),
                          ],
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        stateName,
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 15,
                          fontWeight: isSelected ? FontWeight.w800 : FontWeight.w500,
                          color: isSelected
                              ? (isDark ? Colors.white : const Color(0xFF0B4FD2))
                              : (isDark ? Colors.white70 : const Color(0xFF334155)),
                        ),
                      ),
                      if (isSelected)
                        const Icon(Icons.check_circle_rounded, color: Color(0xFF0B4FD2), size: 20),
                    ],
                  ),
                ),
              );
            },
          ),
        ),

        // Pinned Bottom Button
        SafeArea(
          top: false,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(24, 8, 24, 16),
            child: _WizardActionButton(
              label: _selectedState != null ? 'Create Account' : 'Select a State to Continue',
              enabled: _selectedState != null && !_loading,
              loading: _loading,
              onPressed: _selectedState != null && !_loading
                  ? () => _submitRegistration(requestPush: true)
                  : () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Please select your state of residence from the list.'),
                          duration: Duration(seconds: 2),
                          behavior: SnackBarBehavior.floating,
                        ),
                      );
                    },
            ),
          ),
        ),
      ],
    );
  }
}

/// Signature Wizard Action Button:
/// Full pill, brand electric gradient, micro-bounce scaling, and glowing shadow
class _WizardActionButton extends StatefulWidget {
  final String label;
  final bool enabled;
  final bool loading;
  final VoidCallback onPressed;

  const _WizardActionButton({
    required this.label,
    required this.enabled,
    this.loading = false,
    required this.onPressed,
  });

  @override
  State<_WizardActionButton> createState() => _WizardActionButtonState();
}

class _WizardActionButtonState extends State<_WizardActionButton> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    final brand = BrandConfig.current;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final borderRadius = BorderRadius.circular(brand.buttonRadius);
    final gradientColors = brand.buttonGradient;

    return GestureDetector(
      onTapDown: widget.loading ? null : (_) {
        if (widget.enabled) {
          HapticFeedback.heavyImpact();
          setState(() => _pressed = true);
        }
      },
      onTapUp: widget.loading ? null : (_) => setState(() => _pressed = false),
      onTapCancel: () => setState(() => _pressed = false),
      onTap: widget.loading ? null : widget.onPressed,
      child: AnimatedScale(
        scale: _pressed ? 0.95 : 1.0,
        duration: const Duration(milliseconds: 120),
        curve: Curves.easeOutCubic,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          width: double.infinity,
          height: 56,
          decoration: BoxDecoration(
            gradient: widget.enabled
                ? LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: gradientColors,
                  )
                : LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: gradientColors.map((c) => c.withValues(alpha: isDark ? 0.35 : 0.40)).toList(),
                  ),
            borderRadius: borderRadius,
            boxShadow: widget.enabled
                ? [
                    BoxShadow(
                      color: gradientColors.first.withValues(alpha: isDark ? 0.42 : 0.28),
                      blurRadius: 18,
                      offset: const Offset(0, 6),
                    ),
                  ]
                : null,
          ),
          alignment: Alignment.center,
          child: widget.loading
              ? const SizedBox(
                  width: 22,
                  height: 22,
                  child: CircularProgressIndicator(
                    strokeWidth: 2.5,
                    valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                  ),
                )
              : Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      widget.label,
                      style: GoogleFonts.plusJakartaSans(
                        color: widget.enabled ? Colors.white : Colors.white.withValues(alpha: 0.85),
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 0.2,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Icon(
                      Icons.arrow_forward_rounded,
                      color: widget.enabled ? Colors.white : Colors.white.withValues(alpha: 0.85),
                      size: 18,
                    ),
                  ],
                ),
        ),
      ),
    );
  }
}
