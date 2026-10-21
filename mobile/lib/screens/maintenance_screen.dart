import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../config.dart';
import '../widgets/primary_button.dart';

class MaintenanceScreen extends StatefulWidget {
  final String? message;
  final String? supportPhone;
  final String? supportWhatsApp;
  final Future<void> Function()? onRetry;

  const MaintenanceScreen({
    super.key,
    this.message,
    this.supportPhone,
    this.supportWhatsApp,
    this.onRetry,
  });

  @override
  State<MaintenanceScreen> createState() => _MaintenanceScreenState();
}

class _MaintenanceScreenState extends State<MaintenanceScreen> {
  bool _isChecking = false;

  Future<void> _handleRetry() async {
    if (widget.onRetry == null || _isChecking) return;
    setState(() => _isChecking = true);
    try {
      await widget.onRetry!();
    } finally {
      if (mounted) {
        setState(() => _isChecking = false);
      }
    }
  }

  Future<void> _openWhatsApp() async {
    final phone = widget.supportWhatsApp ?? '';
    if (phone.isEmpty) return;
    final cleanPhone = phone.replaceAll(RegExp(r'[^0-9]'), '');
    final uri = Uri.parse('https://wa.me/$cleanPhone?text=Hello%20Support,%20regarding%20system%20maintenance');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return PopScope(
      canPop: false,
      child: Scaffold(
        body: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 20.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Spacer(),
                Container(
                  width: 110,
                  height: 110,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: theme.colorScheme.primary.withOpacity(0.12),
                  ),
                  child: Center(
                    child: Icon(
                      Icons.engineering_rounded,
                      size: 58,
                      color: theme.colorScheme.primary,
                    ),
                  ),
                ),
                const SizedBox(height: 32),
                Text(
                  'Under Maintenance',
                  style: theme.textTheme.headlineMedium?.copyWith(
                    fontWeight: FontWeight.w900,
                    letterSpacing: -0.5,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: isDark ? Colors.white.withOpacity(0.04) : Colors.black.withOpacity(0.03),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: isDark ? Colors.white10 : Colors.black12,
                    ),
                  ),
                  child: Text(
                    widget.message?.isNotEmpty == true
                        ? widget.message!
                        : '${AppConfig.appName} is currently undergoing scheduled maintenance to improve our speed and service delivery. We will be back online shortly.',
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: isDark ? Colors.white70 : Colors.black87,
                      height: 1.5,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ),
                const Spacer(),
                PrimaryButton(
                  label: _isChecking ? 'Checking...' : 'Check Server Status',
                  icon: Icons.refresh_rounded,
                  onPressed: _isChecking ? null : _handleRetry,
                ),
                const SizedBox(height: 12),
                TextButton.icon(
                  onPressed: _openWhatsApp,
                  icon: const Icon(Icons.chat_bubble_outline_rounded, size: 18),
                  label: const Text('Contact Customer Support'),
                  style: TextButton.styleFrom(
                    foregroundColor: theme.colorScheme.primary,
                  ),
                ),
                const SizedBox(height: 10),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
