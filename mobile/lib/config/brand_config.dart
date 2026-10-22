import 'package:flutter/material.dart';

enum AppBrand {
  mzData,
}

enum ButtonDesignVariant {
  pillGlow,
}

enum DashboardLayoutVariant {
  stackedHero,
}

class BrandConfig {
  final AppBrand brand;
  final String appName;
  final String tagline;
  final String baseUrl;
  final Color primaryColor;
  final Color secondaryColor;
  final Color accentColor;
  final Color onPrimaryColor;
  final List<Color> buttonGradient;
  final double buttonRadius;
  final ButtonDesignVariant buttonVariant;
  final DashboardLayoutVariant dashboardVariant;
  final String logoAssetPath;
  final String iconAssetPath;
  final String supportDomain;
  final String supportEmail;
  final String topicName;
  final String prefixName;
  final String whatsappChannelUrl;
  final String instagramUrl;
  final String tiktokUrl;

  const BrandConfig({
    required this.brand,
    required this.appName,
    required this.tagline,
    required this.baseUrl,
    required this.primaryColor,
    required this.secondaryColor,
    required this.accentColor,
    required this.onPrimaryColor,
    required this.buttonGradient,
    required this.buttonRadius,
    required this.buttonVariant,
    required this.dashboardVariant,
    required this.logoAssetPath,
    required this.iconAssetPath,
    required this.supportDomain,
    required this.supportEmail,
    required this.topicName,
    required this.prefixName,
    required this.whatsappChannelUrl,
    required this.instagramUrl,
    required this.tiktokUrl,
  });

  String get primaryHex =>
      '0x${primaryColor.toARGB32().toRadixString(16).padLeft(8, '0').toUpperCase()}';

  String get privacyUrl => 'https://$supportDomain/privacy';
  String get termsUrl => 'https://$supportDomain/terms';

  // MZ DATA Standalone Configuration
  static const mzData = BrandConfig(
    brand: AppBrand.mzData,
    appName: 'MZ DATA',
    tagline: 'Instant VTU, Airtime & Utility Bills',
    baseUrl: String.fromEnvironment(
      'MZDATA_API_BASE',
      defaultValue: 'https://api.mzdata.org/api/v1',
    ),
    primaryColor: Color(0xFFCCFF00), // Electric Lime
    secondaryColor: Color(0xFF0A0E17), // Premium Deep Navy
    accentColor: Color(0xFF10B981), // Emerald Green Accent
    onPrimaryColor: Color(0xFF0A0E17), // High-contrast navy text on Lime
    buttonGradient: [Color(0xFFCCFF00), Color(0xFFA3E635)], // Modern Lime glow gradient
    buttonRadius: 999.0, // Full Pill glow
    buttonVariant: ButtonDesignVariant.pillGlow,
    dashboardVariant: DashboardLayoutVariant.stackedHero,
    logoAssetPath: 'assets/brand/mzdata-logo.jpg',
    iconAssetPath: 'assets/brand/mzdata-icon.png',
    supportDomain: 'mzdata.org',
    supportEmail: 'mzdatamzdata2@gmail.com',
    topicName: 'mzdata_users',
    prefixName: 'mzdata',
    whatsappChannelUrl: 'https://whatsapp.com/channel/0029VbE2NCI1t90almwOo81x',
    instagramUrl: 'https://www.instagram.com/mzdata.org?igsh=enNtb255MXpuemJ3&utm_source=qr',
    tiktokUrl: 'https://www.tiktok.com/@mzdata_ng',
  );

  /// Always returns mzData for the standalone MZ DATA app
  static BrandConfig get current => mzData;
}
