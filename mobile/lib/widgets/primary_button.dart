import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../theme/axis_tokens.dart';
import '../config/brand_config.dart';

class PrimaryButton extends StatefulWidget {
  const PrimaryButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.loading = false,
    this.icon,
    this.backgroundColor,
    this.foregroundColor,
    this.compact = false,
    this.isPremium = false,
  });

  final String label;
  final VoidCallback? onPressed;
  final bool loading;
  final IconData? icon;
  final Color? backgroundColor;
  final Color? foregroundColor;
  final bool compact;
  final bool isPremium;

  @override
  State<PrimaryButton> createState() => _PrimaryButtonState();
}

class _PrimaryButtonState extends State<PrimaryButton> {
  bool _pressed = false;

  bool get _enabled => widget.onPressed != null && !widget.loading;

  void _handlePress() {
    if (!_enabled) return;
    HapticFeedback.lightImpact();
    widget.onPressed?.call();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final brand = BrandConfig.current;
    final primary = widget.backgroundColor ?? theme.colorScheme.primary;

    final double resolvedRadius = widget.compact
        ? (brand.buttonRadius * 0.75).clamp(8.0, 999.0)
        : brand.buttonRadius;
    final borderRadius = BorderRadius.circular(resolvedRadius);

    final gradientColors = widget.backgroundColor != null
        ? [primary, primary]
        : brand.buttonGradient;

    final defaultFg = widget.backgroundColor != null ? Colors.white : brand.onPrimaryColor;
    final fg = widget.foregroundColor ?? defaultFg;

    return SizedBox(
      width: double.infinity,
      child: Listener(
        onPointerDown: _enabled ? (_) {
          HapticFeedback.heavyImpact();
          setState(() => _pressed = true);
        } : null,
        onPointerUp: _enabled ? (_) => setState(() => _pressed = false) : null,
        onPointerCancel: _enabled ? (_) => setState(() => _pressed = false) : null,
        child: AnimatedScale(
          scale: _pressed ? 0.95 : 1.0,
          duration: AxisDurations.fast,
          curve: Curves.easeOut,
          child: Container(
            decoration: BoxDecoration(
              gradient: _enabled
                  ? LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: gradientColors,
                    )
                  : null,
              color: _enabled ? null : (isDark ? const Color(0xFF1E293B) : const Color(0xFFE2E8F0)),
              borderRadius: borderRadius,

              boxShadow: [
                if (_enabled)
                  BoxShadow(
                    color: gradientColors.first
                        .withValues(alpha: isDark ? 0.35 : 0.22),
                    blurRadius: 16,
                    offset: const Offset(0, 6),
                  ),
              ],
            ),
            child: FilledButton.icon(
              onPressed: _enabled ? _handlePress : null,
              icon: widget.loading
                  ? SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(
                        strokeWidth: 2.2,
                        valueColor: AlwaysStoppedAnimation<Color>(
                          _enabled ? fg : (isDark ? Colors.white38 : const Color(0xFF64748B)),
                        ),
                      ),
                    )
                  : Icon(widget.icon ?? Icons.arrow_forward_rounded, size: 20, color: _enabled ? fg : (isDark ? Colors.white38 : const Color(0xFF64748B))),
              label: Text(widget.label),
              style: FilledButton.styleFrom(
                backgroundColor: Colors.transparent,
                foregroundColor: _enabled ? fg : (isDark ? Colors.white38 : const Color(0xFF64748B)),
                disabledForegroundColor: isDark ? Colors.white38 : const Color(0xFF64748B),
                padding: EdgeInsets.symmetric(
                  horizontal: 20,
                  vertical: widget.compact ? 12 : 16,
                ),
                minimumSize: Size.fromHeight(widget.compact ? 48 : 56),
                shape: RoundedRectangleBorder(
                  borderRadius: borderRadius,
                ),
                textStyle: theme.textTheme.labelLarge?.copyWith(
                  fontSize: 16,
                  letterSpacing: 0.3,
                  fontWeight: FontWeight.w700,
                ),
                elevation: 0,
                shadowColor: Colors.transparent,
                surfaceTintColor: Colors.transparent,
              ),
            ),
          ),
        ),
      ),
    );
  }
}
