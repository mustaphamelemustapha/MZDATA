import 'config/brand_config.dart';
export 'config/brand_config.dart';

class AppConfig {
  static BrandConfig get brand => BrandConfig.current;

  static String get baseUrl {
    const override = String.fromEnvironment('AXISVTU_API_BASE', defaultValue: '');
    return override.isNotEmpty ? override : brand.baseUrl;
  }

  static String get appName {
    const override = String.fromEnvironment('APP_NAME', defaultValue: '');
    return override.isNotEmpty ? override : brand.appName;
  }

  static String get tagline => brand.tagline;

  static String get primaryHex {
    const override = String.fromEnvironment('PRIMARY_COLOR', defaultValue: '');
    return override.isNotEmpty ? override : brand.primaryHex;
  }

  static String get logoAssetPath {
    const override = String.fromEnvironment('LOGO_ASSET', defaultValue: '');
    return override.isNotEmpty ? override : brand.logoAssetPath;
  }

  static String get iconAssetPath => brand.iconAssetPath;

  static String get supportDomain {
    const override = String.fromEnvironment('SUPPORT_DOMAIN', defaultValue: '');
    return override.isNotEmpty ? override : brand.supportDomain;
  }

  static String get topicName {
    const override = String.fromEnvironment('TOPIC_NAME', defaultValue: '');
    return override.isNotEmpty ? override : brand.topicName;
  }

  static String get prefixName {
    const override = String.fromEnvironment('PREFIX_NAME', defaultValue: '');
    return override.isNotEmpty ? override : brand.prefixName;
  }

  static String get privacyUrl => brand.privacyUrl;
  static String get termsUrl => brand.termsUrl;
  static String get supportPhone => brand.supportPhone;
  static String get supportWhatsApp => brand.supportWhatsApp;
  static String get supportEmail => brand.supportEmail;
  static String get whatsappChannelUrl => brand.whatsappChannelUrl;
  static String get appVersion => brand.appVersion;
  static String get buildNumber => brand.buildNumber;
  static String get playStoreLink => brand.playStoreLink;
  static String get appStoreLink => brand.appStoreLink;
}
