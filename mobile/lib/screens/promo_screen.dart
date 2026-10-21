import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../config/brand_config.dart';
import '../models/promo.dart';
import '../services/promo_service.dart';
import '../state/session.dart';
import '../theme/axis_tokens.dart';
import '../utils/fast_route.dart';
import '../widgets/concentric_circles_bg.dart';
import '../widgets/glass_card.dart';
import '../widgets/primary_button.dart';
import 'airtime_screen.dart';
import 'data_screen.dart';

class PromoScreen extends StatefulWidget {
  const PromoScreen({super.key});

  @override
  State<PromoScreen> createState() => _PromoScreenState();
}

class _PromoScreenState extends State<PromoScreen> {
  final _codeController = TextEditingController();
  final _focusNode = FocusNode();

  PromoService get _promoService {
    final token = context.read<SessionController>().token;
    if (token == null) throw Exception("Not authenticated");
    return PromoService(token: token);
  }

  String _errorText = '';
  String _successText = '';
  bool _isLoading = false;
  bool _isClaiming = false;
  List<UserPromo> _promos = [];

  @override
  void initState() {
    super.initState();
    _fetchPromos();
  }

  Future<void> _fetchPromos() async {
    setState(() => _isLoading = true);
    try {
      final promos = await _promoService.getMyPromos();
      if (!mounted) return;
      setState(() {
        _promos = promos;
        _isLoading = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() => _isLoading = false);
    }
  }

  @override
  void dispose() {
    _codeController.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  Future<void> _claimCode() async {
    final code = _codeController.text.trim();
    if (code.isEmpty) {
      setState(() {
        _errorText = 'Please enter a valid promo code.';
        _successText = '';
      });
      return;
    }

    setState(() {
      _errorText = '';
      _successText = '';
      _isClaiming = true;
    });

    try {
      final newPromo = await _promoService.claimPromo(code);
      if (!mounted) return;
      HapticFeedback.mediumImpact();
      setState(() {
        _promos.insert(0, newPromo);
        _isClaiming = false;
        _successText = 'Promo code "${newPromo.promoCode.code}" claimed successfully!';
        _codeController.clear();
      });
      _focusNode.unfocus();
    } catch (e) {
      if (!mounted) return;
      HapticFeedback.heavyImpact();
      setState(() {
        _errorText = e.toString().replaceAll('Exception: ', '').replaceAll('ApiException: ', '');
        _isClaiming = false;
        _successText = '';
      });
    }
  }

  void _copyToClipboard(String text) {
    HapticFeedback.selectionClick();
    Clipboard.setData(ClipboardData(text: text));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.check_circle_rounded, color: Colors.white, size: 18),
            const SizedBox(width: 10),
            Text('Copied "$text" to clipboard'),
          ],
        ),
        backgroundColor: const Color(0xFF16A34A),
        behavior: SnackBarBehavior.floating,
        duration: const Duration(seconds: 2),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primary = BrandConfig.current.primaryColor;
    final textTheme = Theme.of(context).textTheme;

    return Scaffold(
      body: ConcentricCirclesBg(
        child: SafeArea(
          child: Column(
            children: [
              // Header
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                child: Row(
                  children: [
                    InkWell(
                      onTap: () {
                        HapticFeedback.lightImpact();
                        Navigator.of(context).maybePop();
                      },
                      borderRadius: BorderRadius.circular(999),
                      child: Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: isDark ? Colors.white10 : Colors.white,
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: Theme.of(context)
                                .colorScheme
                                .outline
                                .withValues(alpha: isDark ? 0.12 : 0.08),
                          ),
                        ),
                        child: Icon(
                          Icons.chevron_left_rounded,
                          size: 22,
                          color: Theme.of(context).colorScheme.onSurface,
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Promo Codes',
                            style: textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.w800,
                              fontSize: 18,
                              letterSpacing: -0.3,
                            ),
                          ),
                          Text(
                            'Redeem vouchers & discounts',
                            style: textTheme.bodySmall?.copyWith(
                              color: Theme.of(context)
                                  .colorScheme
                                  .onSurface
                                  .withValues(alpha: 0.55),
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      icon: _isLoading
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Icon(Icons.refresh_rounded),
                      onPressed: _isLoading ? null : _fetchPromos,
                      tooltip: 'Refresh Coupons',
                    ),
                  ],
                ),
              ),

              // Scrollable Body
              Expanded(
                child: RefreshIndicator(
                  onRefresh: _fetchPromos,
                  child: ListView(
                    padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
                    children: [
                      // Redeem Card
                      GlassCard(
                        padding: const EdgeInsets.all(20),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Container(
                                  width: 44,
                                  height: 44,
                                  decoration: BoxDecoration(
                                    gradient: LinearGradient(
                                      colors: [
                                        primary,
                                        primary.withValues(alpha: 0.75),
                                      ],
                                      begin: Alignment.topLeft,
                                      end: Alignment.bottomRight,
                                    ),
                                    borderRadius: BorderRadius.circular(14),
                                    boxShadow: [
                                      BoxShadow(
                                        color: primary.withValues(alpha: 0.3),
                                        blurRadius: 10,
                                        offset: const Offset(0, 4),
                                      ),
                                    ],
                                  ),
                                  child: const Icon(
                                    Icons.confirmation_number_rounded,
                                    color: Colors.white,
                                    size: 22,
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        'Have a Coupon Code?',
                                        style: textTheme.titleSmall?.copyWith(
                                          fontWeight: FontWeight.w800,
                                          fontSize: 16,
                                          letterSpacing: -0.3,
                                        ),
                                      ),
                                      const SizedBox(height: 2),
                                      Text(
                                        'Enter code below to unlock instant discounts',
                                        style: textTheme.bodySmall?.copyWith(
                                          color: Theme.of(context)
                                              .colorScheme
                                              .onSurface
                                              .withValues(alpha: 0.6),
                                          fontSize: 12,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 18),

                            // Code Input
                            Container(
                              decoration: BoxDecoration(
                                color: isDark
                                    ? Colors.black.withValues(alpha: 0.25)
                                    : Theme.of(context).colorScheme.surface,
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(
                                  color: Theme.of(context)
                                      .colorScheme
                                      .outline
                                      .withValues(alpha: isDark ? 0.16 : 0.10),
                                ),
                              ),
                              child: TextField(
                                controller: _codeController,
                                focusNode: _focusNode,
                                textCapitalization: TextCapitalization.characters,
                                inputFormatters: [
                                  FilteringTextInputFormatter.allow(RegExp(r'[a-zA-Z0-9_\-]')),
                                ],
                                onChanged: (_) {
                                  if (_errorText.isNotEmpty || _successText.isNotEmpty) {
                                    setState(() {
                                      _errorText = '';
                                      _successText = '';
                                    });
                                  }
                                },
                                style: const TextStyle(
                                  fontWeight: FontWeight.w700,
                                  letterSpacing: 1.5,
                                  fontSize: 15,
                                ),
                                decoration: InputDecoration(
                                  hintText: 'e.g. SAVE20, DATA100',
                                  hintStyle: TextStyle(
                                    letterSpacing: 0,
                                    color: Theme.of(context)
                                        .colorScheme
                                        .onSurface
                                        .withValues(alpha: 0.35),
                                    fontSize: 14,
                                    fontWeight: FontWeight.w500,
                                  ),
                                  prefixIcon: Icon(
                                    Icons.local_offer_rounded,
                                    color: primary,
                                    size: 20,
                                  ),
                                  suffixIcon: _codeController.text.isNotEmpty
                                      ? IconButton(
                                          icon: const Icon(Icons.cancel_rounded, size: 18),
                                          onPressed: () {
                                            _codeController.clear();
                                            setState(() {});
                                          },
                                        )
                                      : null,
                                  border: InputBorder.none,
                                  contentPadding: const EdgeInsets.symmetric(
                                    horizontal: 16,
                                    vertical: 14,
                                  ),
                                ),
                              ),
                            ),

                            // Error or Success Banner
                            if (_errorText.isNotEmpty) ...[
                              const SizedBox(height: 12),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 14,
                                  vertical: 10,
                                ),
                                decoration: BoxDecoration(
                                  color: Theme.of(context)
                                      .colorScheme
                                      .error
                                      .withValues(alpha: 0.08),
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(
                                    color: Theme.of(context)
                                        .colorScheme
                                        .error
                                        .withValues(alpha: 0.2),
                                  ),
                                ),
                                child: Row(
                                  children: [
                                    Icon(
                                      Icons.error_outline_rounded,
                                      size: 16,
                                      color: Theme.of(context).colorScheme.error,
                                    ),
                                    const SizedBox(width: 8),
                                    Expanded(
                                      child: Text(
                                        _errorText,
                                        style: TextStyle(
                                          color: Theme.of(context).colorScheme.error,
                                          fontSize: 12,
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],

                            if (_successText.isNotEmpty) ...[
                              const SizedBox(height: 12),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 14,
                                  vertical: 10,
                                ),
                                decoration: BoxDecoration(
                                  color: const Color(0xFF16A34A).withValues(alpha: 0.1),
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(
                                    color: const Color(0xFF16A34A).withValues(alpha: 0.25),
                                  ),
                                ),
                                child: Row(
                                  children: [
                                    const Icon(
                                      Icons.check_circle_outline_rounded,
                                      size: 16,
                                      color: Color(0xFF16A34A),
                                    ),
                                    const SizedBox(width: 8),
                                    Expanded(
                                      child: Text(
                                        _successText,
                                        style: const TextStyle(
                                          color: Color(0xFF16A34A),
                                          fontSize: 12,
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],

                            const SizedBox(height: 16),
                            PrimaryButton(
                              label: 'Redeem Voucher',
                              onPressed: _isClaiming ? null : _claimCode,
                              loading: _isClaiming,
                              icon: Icons.check_circle_rounded,
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(height: 28),

                      // Section Title
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            children: [
                              Text(
                                'My Vouchers',
                                style: textTheme.titleSmall?.copyWith(
                                  fontWeight: FontWeight.w800,
                                  fontSize: 17,
                                  letterSpacing: -0.3,
                                ),
                              ),
                              const SizedBox(width: 8),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 8,
                                  vertical: 3,
                                ),
                                decoration: BoxDecoration(
                                  color: primary.withValues(alpha: 0.12),
                                  borderRadius: BorderRadius.circular(999),
                                ),
                                child: Text(
                                  '${_promos.length}',
                                  style: TextStyle(
                                    color: primary,
                                    fontSize: 12,
                                    fontWeight: FontWeight.w800,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          if (_promos.isNotEmpty)
                            Text(
                              'Tap coupon to use',
                              style: textTheme.bodySmall?.copyWith(
                                color: Theme.of(context)
                                    .colorScheme
                                    .onSurface
                                    .withValues(alpha: 0.45),
                                fontSize: 12,
                              ),
                            ),
                        ],
                      ),
                      const SizedBox(height: 14),

                      // Promo List
                      if (_isLoading && _promos.isEmpty)
                        const Padding(
                          padding: EdgeInsets.symmetric(vertical: 40),
                          child: Center(child: CircularProgressIndicator()),
                        )
                      else if (_promos.isEmpty)
                        GlassCard(
                          padding: const EdgeInsets.symmetric(
                            vertical: 36,
                            horizontal: 24,
                          ),
                          child: Column(
                            children: [
                              Container(
                                width: 56,
                                height: 56,
                                decoration: BoxDecoration(
                                  color: Theme.of(context)
                                      .colorScheme
                                      .primary
                                      .withValues(alpha: 0.08),
                                  shape: BoxShape.circle,
                                ),
                                child: Icon(
                                  Icons.confirmation_number_outlined,
                                  size: 28,
                                  color: Theme.of(context)
                                      .colorScheme
                                      .onSurface
                                      .withValues(alpha: 0.4),
                                ),
                              ),
                              const SizedBox(height: 16),
                              Text(
                                'No Coupons Claimed Yet',
                                style: textTheme.titleSmall?.copyWith(
                                  fontWeight: FontWeight.w800,
                                  fontSize: 16,
                                ),
                              ),
                              const SizedBox(height: 6),
                              Text(
                                'Enter a promo code above or stay tuned for promotional announcements to unlock discounts.',
                                textAlign: TextAlign.center,
                                style: textTheme.bodySmall?.copyWith(
                                  color: Theme.of(context)
                                      .colorScheme
                                      .onSurface
                                      .withValues(alpha: 0.6),
                                  height: 1.4,
                                ),
                              ),
                            ],
                          ),
                        )
                      else
                        ListView.separated(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          itemCount: _promos.length,
                          separatorBuilder: (context, index) => const SizedBox(height: 14),
                          itemBuilder: (context, index) {
                            final promo = _promos[index];
                            final isUsed = promo.status.toUpperCase() == 'USED';
                            final discountLabel = promo.promoCode.isPercentage
                                ? '${promo.promoCode.discountAmount.toStringAsFixed(0)}% OFF'
                                : '₦${promo.promoCode.discountAmount.toStringAsFixed(0)} OFF';

                            return _CouponTicketCard(
                              promo: promo,
                              isUsed: isUsed,
                              discountLabel: discountLabel,
                              onCopy: () => _copyToClipboard(promo.promoCode.code),
                              onApply: isUsed
                                  ? null
                                  : () => _showUsePromoOptions(context, promo),
                            );
                          },
                        ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showUsePromoOptions(BuildContext context, UserPromo promo) {
    HapticFeedback.lightImpact();
    final primary = BrandConfig.current.primaryColor;

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (c) {
        return ClipRRect(
          borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
          child: Container(
            color: Theme.of(context).colorScheme.surface,
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
            child: SafeArea(
              top: false,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Handle
                  Center(
                    child: Container(
                      width: 44,
                      height: 4,
                      decoration: BoxDecoration(
                        color: Theme.of(context)
                            .colorScheme
                            .outline
                            .withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(999),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Title
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: primary.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Icon(Icons.discount_rounded, color: primary, size: 20),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Use Coupon: ${promo.promoCode.code}',
                              style: const TextStyle(
                                fontWeight: FontWeight.w800,
                                fontSize: 16,
                                letterSpacing: -0.3,
                              ),
                            ),
                            Text(
                              'Select service to apply this discount',
                              style: TextStyle(
                                color: Theme.of(context)
                                    .colorScheme
                                    .onSurface
                                    .withValues(alpha: 0.55),
                                fontSize: 12,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),

                  // Option 1: Data Bundle
                  _ServiceSelectTile(
                    title: 'Buy Data Bundle',
                    subtitle: 'Apply coupon towards high-speed internet',
                    icon: Icons.wifi_rounded,
                    accentColor: const Color(0xFF3B82F6),
                    onTap: () async {
                      Navigator.pop(c);
                      await Navigator.push(
                        context,
                        FastRoute(page: DataScreen(initialPromo: promo)),
                      );
                      _fetchPromos();
                    },
                  ),
                  const SizedBox(height: 10),

                  // Option 2: Airtime Recharge
                  _ServiceSelectTile(
                    title: 'Buy Mobile Airtime',
                    subtitle: 'Apply coupon towards talktime recharge',
                    icon: Icons.phone_iphone_rounded,
                    accentColor: const Color(0xFF10B981),
                    onTap: () async {
                      Navigator.pop(c);
                      await Navigator.push(
                        context,
                        FastRoute(page: AirtimeScreen(initialPromo: promo)),
                      );
                      _fetchPromos();
                    },
                  ),
                  const SizedBox(height: 14),

                  // Cancel
                  SizedBox(
                    width: double.infinity,
                    child: TextButton(
                      onPressed: () => Navigator.pop(c),
                      style: TextButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                      ),
                      child: Text(
                        'Cancel',
                        style: TextStyle(
                          color: Theme.of(context)
                              .colorScheme
                              .onSurface
                              .withValues(alpha: 0.6),
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}

class _CouponTicketCard extends StatelessWidget {
  const _CouponTicketCard({
    required this.promo,
    required this.isUsed,
    required this.discountLabel,
    required this.onCopy,
    required this.onApply,
  });

  final UserPromo promo;
  final bool isUsed;
  final String discountLabel;
  final VoidCallback onCopy;
  final VoidCallback? onApply;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primary = BrandConfig.current.primaryColor;

    final dateText = isUsed
        ? (promo.usedAt != null
            ? 'Used on ${DateFormat('d MMM, yyyy').format(promo.usedAt!)}'
            : 'Redeemed')
        : (promo.promoCode.expiresAt != null
            ? 'Expires ${DateFormat('d MMM, yyyy').format(promo.promoCode.expiresAt!)}'
            : 'No expiration');

    return Container(
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF0E1624) : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: Theme.of(context)
              .colorScheme
              .outline
              .withValues(alpha: isDark ? 0.12 : 0.08),
        ),
        boxShadow: AxisShadows.softGlow,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Top section
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Discount Badge
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: isUsed
                        ? (isDark ? Colors.white12 : const Color(0xFFF1F5F9))
                        : const Color(0xFF16A34A).withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                      color: isUsed
                          ? Colors.transparent
                          : const Color(0xFF16A34A).withValues(alpha: 0.25),
                    ),
                  ),
                  child: Text(
                    discountLabel,
                    style: TextStyle(
                      color: isUsed
                          ? (isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B))
                          : const Color(0xFF16A34A),
                      fontSize: 13,
                      fontWeight: FontWeight.w900,
                      letterSpacing: -0.2,
                    ),
                  ),
                ),
                const SizedBox(width: 8),

                // Network / applicability tag
                if (promo.promoCode.applicableNetwork != 'ALL')
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                    decoration: BoxDecoration(
                      color: primary.withValues(alpha: 0.08),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Text(
                      promo.promoCode.applicableNetwork.toUpperCase(),
                      style: TextStyle(
                        color: primary,
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),

                const Spacer(),

                // Status pill
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: isUsed
                        ? (isDark ? Colors.white10 : const Color(0xFFF1F5F9))
                        : primary.withValues(alpha: 0.10),
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        isUsed
                            ? Icons.check_circle_rounded
                            : Icons.check_circle_outline_rounded,
                        size: 13,
                        color: isUsed
                            ? (isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B))
                            : primary,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        isUsed ? 'REDEEMED' : 'READY',
                        style: TextStyle(
                          color: isUsed
                              ? (isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B))
                              : primary,
                          fontSize: 11,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Code Row with Copy
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      InkWell(
                        onTap: onCopy,
                        borderRadius: BorderRadius.circular(8),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              promo.promoCode.code,
                              style: TextStyle(
                                fontFamily: 'monospace',
                                fontSize: 18,
                                fontWeight: FontWeight.w900,
                                letterSpacing: 1.2,
                                color: isUsed
                                    ? Theme.of(context)
                                        .colorScheme
                                        .onSurface
                                        .withValues(alpha: 0.45)
                                    : Theme.of(context).colorScheme.onSurface,
                              ),
                            ),
                            const SizedBox(width: 6),
                            Icon(
                              Icons.copy_rounded,
                              size: 15,
                              color: Theme.of(context)
                                  .colorScheme
                                  .onSurface
                                  .withValues(alpha: 0.4),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        promo.promoCode.description ?? 'Special discount voucher on services.',
                        style: TextStyle(
                          fontSize: 13,
                          color: Theme.of(context)
                              .colorScheme
                              .onSurface
                              .withValues(alpha: 0.6),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 14),

          // Divider
          Divider(
            height: 1,
            thickness: 1,
            color: Theme.of(context)
                .colorScheme
                .outline
                .withValues(alpha: isDark ? 0.08 : 0.05),
          ),

          // Bottom Bar: Date & Apply Button
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Icon(
                      Icons.schedule_rounded,
                      size: 14,
                      color: Theme.of(context)
                          .colorScheme
                          .onSurface
                          .withValues(alpha: 0.4),
                    ),
                    const SizedBox(width: 4),
                    Text(
                      dateText,
                      style: TextStyle(
                        fontSize: 12,
                        color: Theme.of(context)
                            .colorScheme
                            .onSurface
                            .withValues(alpha: 0.45),
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
                if (!isUsed)
                  InkWell(
                    onTap: onApply,
                    borderRadius: BorderRadius.circular(10),
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 14,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [
                            primary,
                            primary.withValues(alpha: 0.8),
                          ],
                        ),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            'Use Coupon',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 12,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                          SizedBox(width: 4),
                          Icon(Icons.arrow_forward_rounded, color: Colors.white, size: 14),
                        ],
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ServiceSelectTile extends StatelessWidget {
  const _ServiceSelectTile({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.accentColor,
    required this.onTap,
  });

  final String title;
  final String subtitle;
  final IconData icon;
  final Color accentColor;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () {
          HapticFeedback.selectionClick();
          onTap();
        },
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          decoration: BoxDecoration(
            color: isDark ? Colors.white.withValues(alpha: 0.04) : const Color(0xFFF8FAFC),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: Theme.of(context)
                  .colorScheme
                  .outline
                  .withValues(alpha: isDark ? 0.10 : 0.06),
            ),
          ),
          child: Row(
            children: [
              Container(
                width: 42,
                height: 42,
                decoration: BoxDecoration(
                  color: accentColor.withValues(alpha: 0.12),
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, color: accentColor, size: 22),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: 15,
                        letterSpacing: -0.2,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      subtitle,
                      style: TextStyle(
                        fontSize: 12,
                        color: Theme.of(context)
                            .colorScheme
                            .onSurface
                            .withValues(alpha: 0.55),
                      ),
                    ),
                  ],
                ),
              ),
              Icon(
                Icons.chevron_right_rounded,
                color: Theme.of(context)
                    .colorScheme
                    .onSurface
                    .withValues(alpha: 0.35),
                size: 22,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
