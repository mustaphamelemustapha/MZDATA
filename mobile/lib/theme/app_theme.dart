import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import 'axis_tokens.dart';

class AppTheme {
  static const _seed = Color(0xFFCCFF00); // Electric Lime
  static const _secondary = Color(0xFFFFFFFF); // Pure White
  static const _lightBg = Color(0xFFFFFFFF);
  static const _darkBg = Color(0xFF000000); // True Black
  static const _darkSurface = Color(0xFF111111); // Very Dark Gray
  static const _lightSurfaceElevated = Color(0xFFF5F5F5);
  static const _darkSurfaceSoft = Color(0xFF1A1A1A); // Input Fields

  static ThemeData light() => _build(Brightness.light);

  static ThemeData dark() => _build(Brightness.dark);

  static ThemeData _build(Brightness brightness) {
    final isDark = brightness == Brightness.dark;
    final scheme =
        ColorScheme.fromSeed(
          seedColor: _seed,
          brightness: brightness,
          secondary: _secondary,
        ).copyWith(
          primary: _seed,
          secondary: _secondary,
          surface: isDark ? _darkBg : _lightBg,
          onSurface: isDark ? Colors.white : Colors.black,
          onSurfaceVariant: isDark ? const Color(0xFFAAAAAA) : const Color(0xFF555555),
          outline: isDark ? const Color(0xFF333333) : const Color(0xFFE5E5E5),
          outlineVariant: isDark ? const Color(0xFF222222) : const Color(0xFFF0F0F0),
          onPrimary: Colors.black, // Black text on Electric Lime buttons
          onSecondary: isDark ? Colors.black : Colors.white,
          onError: Colors.white,
          error: const Color(0xFFFF3333),
          tertiary: const Color(0xFF888888),
          onTertiary: Colors.white,
          surfaceTint: Colors.transparent,
          surfaceContainerHighest: isDark ? const Color(0xFF111111) : const Color(0xFFF5F5F5),
          shadow: Colors.black,
        );

    final baseText = GoogleFonts.outfitTextTheme().apply(
      bodyColor: scheme.onSurface,
      displayColor: scheme.onSurface,
    );
    final textTheme = _applyTabularNumbers(
      baseText.copyWith(
        displayLarge: baseText.displayLarge?.copyWith(
          fontSize: 28,
          height: 1.18,
          letterSpacing: -0.7,
          fontWeight: FontWeight.w800,
        ),
        displayMedium: baseText.displayMedium?.copyWith(
          fontSize: 26,
          height: 1.2,
          letterSpacing: -0.55,
          fontWeight: FontWeight.w800,
        ),
        displaySmall: baseText.displaySmall?.copyWith(
          fontSize: 24,
          height: 1.22,
          letterSpacing: -0.45,
          fontWeight: FontWeight.w800,
        ),
        headlineLarge: baseText.headlineLarge?.copyWith(
          fontSize: 22,
          height: 1.25,
          letterSpacing: -0.35,
          fontWeight: FontWeight.w800,
        ),
        headlineMedium: baseText.headlineMedium?.copyWith(
          fontSize: 20,
          height: 1.28,
          letterSpacing: -0.2,
          fontWeight: FontWeight.w800,
        ),
        headlineSmall: baseText.headlineSmall?.copyWith(
          fontSize: 18,
          height: 1.3,
          letterSpacing: -0.1,
          fontWeight: FontWeight.w800,
        ),
        titleLarge: baseText.titleLarge?.copyWith(
          fontSize: 18,
          height: 1.3,
          fontWeight: FontWeight.w800,
        ),
        titleMedium: baseText.titleMedium?.copyWith(
          fontSize: 16,
          height: 1.35,
          fontWeight: FontWeight.w800,
        ),
        titleSmall: baseText.titleSmall?.copyWith(
          fontSize: 14,
          height: 1.35,
          fontWeight: FontWeight.w800,
        ),
        bodyLarge: baseText.bodyLarge?.copyWith(
          fontSize: 16,
          height: 1.5,
          fontWeight: FontWeight.w600,
        ),
        bodyMedium: baseText.bodyMedium?.copyWith(
          fontSize: 14,
          height: 1.45,
          fontWeight: FontWeight.w600,
        ),
        bodySmall: baseText.bodySmall?.copyWith(
          fontSize: 12,
          height: 1.35,
          fontWeight: FontWeight.w600,
        ),
        labelLarge: baseText.labelLarge?.copyWith(
          fontSize: 14,
          height: 1.3,
          fontWeight: FontWeight.w800,
        ),
        labelMedium: baseText.labelMedium?.copyWith(
          fontSize: 12,
          height: 1.25,
          fontWeight: FontWeight.w800,
        ),
        labelSmall: baseText.labelSmall?.copyWith(
          fontSize: 11,
          height: 1.25,
          fontWeight: FontWeight.w800,
        ),
      ),
    );

    return ThemeData(
      useMaterial3: true,
      colorScheme: scheme,
      fontFamily: GoogleFonts.outfit().fontFamily,
      visualDensity: VisualDensity.standard,
      scaffoldBackgroundColor: isDark ? _darkBg : _lightBg,
      textTheme: textTheme,
      shadowColor: Colors.black.withValues(alpha: isDark ? 0.3 : 0.1),
      splashFactory: NoSplash.splashFactory, // Neo-brutalism usually lacks ripples
      pageTransitionsTheme: const PageTransitionsTheme(
        builders: {
          TargetPlatform.android: FadeUpwardsPageTransitionsBuilder(),
          TargetPlatform.iOS: CupertinoPageTransitionsBuilder(),
          TargetPlatform.macOS: CupertinoPageTransitionsBuilder(),
          TargetPlatform.windows: FadeUpwardsPageTransitionsBuilder(),
          TargetPlatform.linux: FadeUpwardsPageTransitionsBuilder(),
        },
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: Colors.transparent,
        elevation: 0,
        foregroundColor: scheme.onSurface,
        centerTitle: false,
        toolbarHeight: 72,
        titleTextStyle: textTheme.titleLarge?.copyWith(
          fontWeight: FontWeight.w700,
        ),
      ),
      cardTheme: CardThemeData(
        color: isDark ? _darkSurface : Colors.white,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: isDark ? const BorderSide(color: Color(0xFF333333), width: 1.5) : const BorderSide(color: Color(0xFFE5E5E5), width: 1.5),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: isDark ? _darkSurfaceSoft : _lightSurfaceElevated,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 16,
        ),
        hintStyle: textTheme.bodyMedium?.copyWith(
          color: scheme.onSurface.withValues(alpha: isDark ? 0.58 : 0.48),
        ),
        labelStyle: textTheme.labelMedium?.copyWith(
          color: scheme.onSurface.withValues(alpha: isDark ? 0.76 : 0.64),
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: scheme.outline),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: scheme.outline),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: scheme.primary, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: scheme.error),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: scheme.error, width: 2),
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          padding: const EdgeInsets.symmetric(vertical: 18, horizontal: 20),
          minimumSize: const Size.fromHeight(56),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          textStyle: textTheme.labelLarge?.copyWith(
            fontSize: 16,
            letterSpacing: 0,
            fontWeight: FontWeight.w800,
          ),
          animationDuration: AxisDurations.fast,
          backgroundColor: scheme.primary,
          foregroundColor: scheme.onPrimary,
          elevation: 0,
          surfaceTintColor: Colors.transparent,
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 20),
          minimumSize: const Size.fromHeight(54),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AxisRadii.lg),
          ),
          side: BorderSide(color: scheme.outline.withValues(alpha: 0.9)),
          textStyle: textTheme.labelLarge?.copyWith(
            fontSize: 16,
            letterSpacing: 0.35,
            fontWeight: FontWeight.w600,
          ),
          animationDuration: AxisDurations.normal,
          foregroundColor: scheme.onSurface,
        ),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: isDark
            ? scheme.primary.withValues(alpha: 0.12)
            : const Color(0xFFF0F5FF),
        labelStyle: textTheme.labelLarge,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(100)),
        side: BorderSide(color: scheme.outline.withValues(alpha: isDark ? 0.35 : 0.9)),
      ),
      snackBarTheme: SnackBarThemeData(
        backgroundColor: isDark
            ? const Color(0xFF101826)
            : const Color(0xFF0F172A),
        contentTextStyle: textTheme.bodyMedium?.copyWith(color: Colors.white),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AxisRadii.lg),
        ),
        behavior: SnackBarBehavior.floating,
      ),
      dialogTheme: DialogThemeData(
        backgroundColor: isDark ? _darkSurface : Colors.white,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AxisRadii.xl),
        ),
      ),
      bottomSheetTheme: BottomSheetThemeData(
        backgroundColor: isDark ? _darkBg : _lightBg,
        modalBackgroundColor: isDark ? _darkBg : _lightBg,
        surfaceTintColor: Colors.transparent,
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(
            top: Radius.circular(24),
          ),
        ),
      ),
      navigationBarTheme: NavigationBarThemeData(
        elevation: 0,
        indicatorColor: Colors.transparent,
        backgroundColor: isDark ? _darkSurface : Colors.white,
        surfaceTintColor: Colors.transparent,
        labelTextStyle: WidgetStateProperty.resolveWith((states) {
          final isSelected = states.contains(WidgetState.selected);
          return textTheme.labelMedium?.copyWith(
            fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
            color: isSelected ? scheme.primary : scheme.onSurfaceVariant,
          );
        }),
        iconTheme: WidgetStateProperty.resolveWith((states) {
          final isSelected = states.contains(WidgetState.selected);
          return IconThemeData(
            size: 24,
            color: isSelected ? scheme.primary : scheme.onSurfaceVariant,
          );
        }),
      ),
      dividerColor: scheme.outline.withValues(alpha: isDark ? 0.65 : 0.9),
      iconTheme: IconThemeData(
        color: scheme.onSurface.withValues(alpha: isDark ? 0.82 : 0.88),
        size: 22,
      ),
      textSelectionTheme: TextSelectionThemeData(
        cursorColor: scheme.primary,
        selectionColor: scheme.primary.withValues(alpha: 0.2),
        selectionHandleColor: scheme.primary,
      ),
      extensions: const [AxisPalette()],
    );
  }

  static TextTheme _applyTabularNumbers(TextTheme base) {
    TextStyle? withFigures(TextStyle? style) {
      return style?.copyWith(
        fontFeatures: const [ui.FontFeature.tabularFigures()],
      );
    }

    return base.copyWith(
      displayLarge: withFigures(base.displayLarge),
      displayMedium: withFigures(base.displayMedium),
      displaySmall: withFigures(base.displaySmall),
      headlineLarge: withFigures(base.headlineLarge),
      headlineMedium: withFigures(base.headlineMedium),
      headlineSmall: withFigures(base.headlineSmall),
      titleLarge: withFigures(base.titleLarge),
      titleMedium: withFigures(base.titleMedium),
      titleSmall: withFigures(base.titleSmall),
      bodyLarge: withFigures(base.bodyLarge),
      bodyMedium: withFigures(base.bodyMedium),
      bodySmall: withFigures(base.bodySmall),
      labelLarge: withFigures(base.labelLarge),
      labelMedium: withFigures(base.labelMedium),
      labelSmall: withFigures(base.labelSmall),
    );
  }
}

class AxisPalette extends ThemeExtension<AxisPalette> {
  const AxisPalette();

  static const gradient = LinearGradient(
    colors: [Color(0xFFCCFF00), Color(0xFF00E5FF)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const warmGradient = LinearGradient(
    colors: [Color(0xFFFF3333), Color(0xFFFF8800)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const softBackgroundGradient = LinearGradient(
    colors: [Color(0xFF000000), Color(0xFF0A0A0A), Color(0xFF000000)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const lightWashGradient = LinearGradient(
    colors: [Color(0xFFF5F5F5), Color(0xFFE5E5E5), Color(0xFFF5F5F5)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  @override
  ThemeExtension<AxisPalette> copyWith() => this;

  @override
  ThemeExtension<AxisPalette> lerp(
    ThemeExtension<AxisPalette>? other,
    double t,
  ) => this;
}
