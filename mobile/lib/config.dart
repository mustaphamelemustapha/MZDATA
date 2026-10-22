import 'config/brand_config.dart';
export 'config/brand_config.dart';

class AppConfig {
  static BrandConfig get brand => BrandConfig.current;

  static String get baseUrl {
    const override = String.fromEnvironment('MZDATA_API_BASE', defaultValue: '');
    return override.isNotEmpty ? override : brand.baseUrl;
  }

  static String get appName => brand.appName;
  static String get tagline => brand.tagline;
  static String get primaryHex => brand.primaryHex;
  static String get logoAssetPath => brand.logoAssetPath;
  static String get iconAssetPath => brand.iconAssetPath;
  static String get supportDomain => brand.supportDomain;
  static String get supportEmail => brand.supportEmail;
  static String get topicName => brand.topicName;
  static String get prefixName => brand.prefixName;
  static String get whatsappChannelUrl => brand.whatsappChannelUrl;
  static String get instagramUrl => brand.instagramUrl;
  static String get tiktokUrl => brand.tiktokUrl;
  static String get privacyUrl => brand.privacyUrl;
  static String get termsUrl => brand.termsUrl;
}
