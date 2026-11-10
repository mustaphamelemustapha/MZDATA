import 'package:flutter/material.dart';
import 'package:flutter/services.dart' show appFlavor;

enum AppBrand {
  meleData,
  mzData,
  kullomaData,
}

enum ButtonDesignVariant {
  pillGlow,       // Mele Data: Neo-banking rounded pill, gradient glow
  sharpCorporate, // MZ Data: Modern 12-14px rounded-rect with bold border & dual-tone elevation
  squircleSoft,   // Kulloma Data: 20px soft squircle with subtle floating shadow
}

enum DashboardLayoutVariant {
  stackedHero,    // Mele Data: Full balance hero card + horizontal actions + recent list
  corporateGrid,  // MZ Data: Compact split banner + 4-column quick grid + distinct ledger cards
  floatingMinimal,// Kulloma Data: Floating balance card + clean vertical service list
}

class BrandConfig {
  final AppBrand brand;
  final String appName;
  final String tagline;
  final String baseUrl;
  final Color primaryColor;
  final Color secondaryColor;
  final Color accentColor;
  final List<Color> buttonGradient;
  final double buttonRadius;
  final ButtonDesignVariant buttonVariant;
  final DashboardLayoutVariant dashboardVariant;
  final String logoAssetPath;
  final String iconAssetPath;
  final String supportDomain;
  final String supportEmail;
  final String supportPhone;
  final String supportWhatsApp;
  final String whatsappChannelUrl;
  final String appVersion;
  final String buildNumber;
  final String topicName;
  final String prefixName;

  final String playStoreLink;
  final String appStoreLink;

  const BrandConfig({
    required this.brand,
    required this.appName,
    required this.tagline,
    required this.baseUrl,
    required this.primaryColor,
    required this.secondaryColor,
    required this.accentColor,
    required this.buttonGradient,
    required this.buttonRadius,
    required this.buttonVariant,
    required this.dashboardVariant,
    required this.logoAssetPath,
    required this.iconAssetPath,
    required this.supportDomain,
    required this.supportEmail,
    required this.supportPhone,
    required this.supportWhatsApp,
    required this.whatsappChannelUrl,
    required this.appVersion,
    required this.buildNumber,
    required this.topicName,
    required this.prefixName,
    this.playStoreLink = '',
    this.appStoreLink = '',
  });

  String get primaryHex =>
      '0x${primaryColor.toARGB32().toRadixString(16).padLeft(8, '0').toUpperCase()}';

  String get privacyUrl => 'https://$supportDomain/privacy';
  String get termsUrl => 'https://$supportDomain/terms';

  // 1. MELE DATA (Live on Play Store & App Store: 1,200+ users)
  static const meleData = BrandConfig(
    brand: AppBrand.meleData,
    appName: 'MELE DATA',
    tagline: 'Instant VTU, Airtime & Utility Bills',
    baseUrl: 'https://api.meledata.ng/api/v1',
    primaryColor: Color(0xFF0B4FD2), // Royal Electric Blue
    secondaryColor: Color(0xFF00C6FF), // Cyan Accent
    accentColor: Color(0xFFF97316),
    buttonGradient: [Color(0xFF0B4FD2), Color(0xFF00C6FF)],
    buttonRadius: 999.0, // Full Pill
    buttonVariant: ButtonDesignVariant.pillGlow,
    dashboardVariant: DashboardLayoutVariant.stackedHero,
    logoAssetPath: 'assets/brand/meledata-logo.png',
    iconAssetPath: 'assets/brand/meledata-icon.png',
    supportDomain: 'meledata.ng',
    supportEmail: 'mmtechglobe@gmail.com',
    supportPhone: '+2348141114647',
    supportWhatsApp: '+2348141114647',
    whatsappChannelUrl: 'https://whatsapp.com/channel/0029VbCanujEawdvqLAYu83T',
    appVersion: '1.2.6',
    buildNumber: '43',
    topicName: 'meledata_users',
    prefixName: 'meledata',
    playStoreLink: 'https://play.google.com/store/apps/details?id=com.mmtech.axisvtu',
    appStoreLink: 'https://apps.apple.com/ng/app/mele-data/id6779367547',
  );

  // 2. MZ DATA (Bespoke Corporate FinTech identity for Apple & Google compliance)
  static const mzData = BrandConfig(
    brand: AppBrand.mzData,
    appName: 'MZ DATA',
    tagline: 'Next-Gen SME Telecom & Digital Bill Hub',
    baseUrl: 'https://api.mzdata.org/api/v1',
    primaryColor: Color(0xFF0A2540), // Corporate Deep Navy
    secondaryColor: Color(0xFF10B981), // Emerald Green Accent
    accentColor: Color(0xFF059669),
    buttonGradient: [Color(0xFF0A2540), Color(0xFF10B981)], // Distinct corporate emerald gradient
    buttonRadius: 14.0, // Modern crisp geometric
    buttonVariant: ButtonDesignVariant.sharpCorporate,
    dashboardVariant: DashboardLayoutVariant.corporateGrid,
    logoAssetPath: 'assets/brand/mzdata-logo.jpg',
    iconAssetPath: 'assets/brand/mzdata-icon.png',
    supportDomain: 'mzdata.org',
    supportEmail: 'mzdatamzdata2@gmail.com',
    supportPhone: '09067054672',
    supportWhatsApp: '2349067054672',
    whatsappChannelUrl: 'https://whatsapp.com/channel/0029VbE2NCI1t90almwOo81x',
    appVersion: '1.0.0',
    buildNumber: '1',
    topicName: 'mzdata_users',
    prefixName: 'mzdata',
  );

  // 3. KULLOMA DATA (Utility & Consumer Brand identity)
  static const kullomaData = BrandConfig(
    brand: AppBrand.kullomaData,
    appName: 'KULLOMA DATA',
    tagline: 'Fast, Reliable Airtime & Utility Top-Ups',
    baseUrl: 'https://api.kullomadata.com/api/v1',
    primaryColor: Color(0xFF5B21B6), // Deep Royal Purple
    secondaryColor: Color(0xFFF59E0B), // Vibrant Amber Gold
    accentColor: Color(0xFF8B5CF6),
    buttonGradient: [Color(0xFF6D28D9), Color(0xFF8B5CF6)],
    buttonRadius: 20.0, // Soft squircle
    buttonVariant: ButtonDesignVariant.squircleSoft,
    dashboardVariant: DashboardLayoutVariant.floatingMinimal,
    logoAssetPath: 'assets/brand/KullomaData.jpeg',
    iconAssetPath: 'assets/brand/KullomaData.jpeg',
    supportDomain: 'kullomadata.com',
    supportEmail: 'kullomadata@gmail.com',
    supportPhone: '+2348034283352',
    supportWhatsApp: '+2348034283352',
    whatsappChannelUrl: 'https://whatsapp.com/channel/0029VbEIpZ0D8SE5t4kOUh2T',
    appVersion: '1.0.2',
    buildNumber: '50',
    topicName: 'kullomadata_users',
    prefixName: 'kullomadata',
    playStoreLink: 'https://play.google.com/store/apps/details?id=com.kullomadata.app',
    appStoreLink: '',
  );

  /// Resolves the active brand dynamically from build environment flags.
  /// Defaults safely to Mele Data if no flag is passed.
  static BrandConfig get current {
    const rawFlavor = String.fromEnvironment('APP_FLAVOR', defaultValue: '');
    const rawName = String.fromEnvironment('APP_NAME', defaultValue: '');
    const rawPrefix = String.fromEnvironment('PREFIX_NAME', defaultValue: '');

    final flutterFlavor = (appFlavor ?? '').toLowerCase();
    final envKey = (rawFlavor.isNotEmpty
            ? rawFlavor
            : (rawPrefix.isNotEmpty ? rawPrefix : rawName))
        .toLowerCase();

    final key = flutterFlavor.isNotEmpty ? flutterFlavor : envKey;

    if (key.contains('mz')) {
      return mzData;
    } else if (key.contains('kulloma')) {
      return kullomaData;
    } else {
      return meleData;
    }
  }
}
