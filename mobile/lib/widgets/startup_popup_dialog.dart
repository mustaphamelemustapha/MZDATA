import 'dart:io' show Platform;
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../config.dart';

class StartupPopupDialog extends StatelessWidget {
  final Map<String, dynamic> announcement;

  const StartupPopupDialog({super.key, required this.announcement});

  static Future<void> show(BuildContext context, Map<String, dynamic> announcement) {
    return showDialog(
      context: context,
      barrierDismissible: true,
      builder: (_) => StartupPopupDialog(announcement: announcement),
    );
  }

  static Future<void> _launchLink(String rawLink) async {
    String link = rawLink.trim();
    if (link.isEmpty) return;

    // Smart store detection: auto route to Play Store on Android and App Store on iOS
    final isStoreLink = link.contains('play.google.com') ||
        link.contains('apps.apple.com') ||
        link.toLowerCase() == 'store';

    if (isStoreLink) {
      if (Platform.isIOS) {
        link = AppConfig.appStoreLink.isNotEmpty
            ? AppConfig.appStoreLink
            : 'https://apps.apple.com/ng/app/mele-data/id6779367547';
      } else {
        link = AppConfig.playStoreLink.isNotEmpty
            ? AppConfig.playStoreLink
            : 'https://play.google.com/store/apps/details?id=com.mmtech.axisvtu';
      }
    }

    if (!link.startsWith('http://') &&
        !link.startsWith('https://') &&
        !link.startsWith('tel:') &&
        !link.startsWith('mailto:')) {
      link = 'https://$link';
    }
    final uri = Uri.tryParse(link);
    if (uri != null) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    final title = (announcement['title'] ?? '').toString().trim();
    final message = (announcement['message'] ?? announcement['text'] ?? '').toString().trim();
    final imageUrl = (announcement['image_url'] ?? '').toString().trim();
    final buttonLabel = (announcement['button_label'] ?? '').toString().trim();
    final buttonLink = (announcement['button_link'] ?? '').toString().trim();
    final hasButton = buttonLabel.isNotEmpty && buttonLink.isNotEmpty;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final dialogBg = isDark ? const Color(0xFF1E293B) : Colors.white;
    final titleColor = isDark ? Colors.white : const Color(0xFF0F172A);
    final bodyColor = isDark ? const Color(0xFFCBD5E1) : const Color(0xFF475569);

    return Dialog(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
      ),
      backgroundColor: dialogBg,
      clipBehavior: Clip.antiAlias,
      insetPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 36),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 420),
        child: Stack(
          children: [
            SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Optional Image Banner
                  if (imageUrl.isNotEmpty)
                    Container(
                      constraints: const BoxConstraints(maxHeight: 240),
                      width: double.infinity,
                      color: isDark ? const Color(0xFF0F172A) : const Color(0xFFF1F5F9),
                      child: Image.network(
                        imageUrl,
                        fit: BoxFit.cover,
                        loadingBuilder: (ctx, child, progress) {
                          if (progress == null) return child;
                          return Container(
                            height: 180,
                            alignment: Alignment.center,
                            child: const SizedBox(
                              width: 28,
                              height: 28,
                              child: CircularProgressIndicator(strokeWidth: 2.5),
                            ),
                          );
                        },
                        errorBuilder: (ctx, err, stack) => const SizedBox.shrink(),
                      ),
                    ),

                  // Content Body
                  Padding(
                    padding: EdgeInsets.fromLTRB(20, imageUrl.isNotEmpty ? 18 : 24, 20, 20),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        if (title.isNotEmpty) ...[
                          Text(
                            title,
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w800,
                              color: titleColor,
                              letterSpacing: -0.2,
                            ),
                          ),
                          const SizedBox(height: 10),
                        ],

                        if (message.isNotEmpty) ...[
                          Text(
                            message,
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              fontSize: 14,
                              height: 1.45,
                              color: bodyColor,
                            ),
                          ),
                          const SizedBox(height: 22),
                        ],

                        // Action Button (if link provided)
                        if (hasButton) ...[
                          SizedBox(
                            width: double.infinity,
                            height: 48,
                            child: ElevatedButton(
                              onPressed: () async {
                                Navigator.of(context).pop();
                                await _launchLink(buttonLink);
                              },
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFF0B4FD2),
                                foregroundColor: Colors.white,
                                elevation: 0,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                              ),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Text(
                                    buttonLabel,
                                    style: const TextStyle(
                                      fontSize: 15,
                                      fontWeight: FontWeight.w700,
                                    ),
                                  ),
                                  const SizedBox(width: 6),
                                  const Icon(Icons.arrow_outward_rounded, size: 16),
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(height: 10),
                        ],

                        // Dismiss / Close Button
                        SizedBox(
                          width: double.infinity,
                          height: 44,
                          child: TextButton(
                            onPressed: () => Navigator.of(context).pop(),
                            style: TextButton.styleFrom(
                              foregroundColor: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                            ),
                            child: const Text(
                              'Dismiss',
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            // Top-Right Floating Close Button
            Positioned(
              top: 10,
              right: 10,
              child: GestureDetector(
                behavior: HitTestBehavior.opaque,
                onTap: () => Navigator.of(context).pop(),
                child: Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: Colors.black.withValues(alpha: 0.5),
                    shape: BoxShape.circle,
                  ),
                  child: const Center(
                    child: Icon(
                      Icons.close_rounded,
                      color: Colors.white,
                      size: 20,
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
