import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:share_plus/share_plus.dart';
import '../config.dart';
import '../services/wallet_service.dart';
import '../state/session.dart';

class FundWalletSheet extends StatefulWidget {
  const FundWalletSheet({super.key});

  static void show(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (context) => const FundWalletSheet(),
    );
  }

  @override
  State<FundWalletSheet> createState() => _FundWalletSheetState();
}

class _FundWalletSheetState extends State<FundWalletSheet> {
  // Page controller for razor-sharp, smooth 60fps horizontal transitions
  late final PageController _pageController;

  bool _loading = true;
  bool _creating = false;
  String? _error;
  List<Map<String, dynamic>> _accounts = [];
  bool _bannerDismissed = false;
  bool _useNin = true; // Default to NIN for safety & peace of mind

  // Selected account in Step 1
  String _selectedProviderKey = 'moniepoint'; // 'moniepoint' or 'palmpay'

  // Controller for Step 2
  final TextEditingController _idController = TextEditingController();
  String? _inputError;

  @override
  void initState() {
    super.initState();
    _pageController = PageController(initialPage: 0, keepPage: false);
    _loadAccounts();
    _idController.addListener(() {
      if (_inputError != null) {
        setState(() => _inputError = null);
      } else if (mounted) {
        setState(() {});
      }
    });
  }

  @override
  void dispose() {
    _pageController.dispose();
    _idController.dispose();
    super.dispose();
  }

  void _goToPage(int page) {
    if (!mounted) return;
    _pageController.animateToPage(
      page,
      duration: const Duration(milliseconds: 220),
      curve: Curves.easeOutCubic,
    );
  }

  Future<void> _loadAccounts({bool silent = false}) async {
    final token = (context.read<SessionController>().token ?? '').trim();
    if (token.isEmpty) {
      if (mounted) setState(() { _loading = false; _error = 'Not authenticated'; });
      return;
    }

    if (!silent) {
      setState(() => _loading = true);
    }

    try {
      final res = await WalletService(token: token).getBankAccounts(forceRefresh: true);
      final List raw = res['accounts'] ?? [];

      if (raw.isNotEmpty) {
        final accounts = raw.map((e) => Map<String, dynamic>.from(e as Map)).toList();

        // Priority sort: 9PSB -> Safehaven -> Moniepoint -> PalmPay -> Paga
        accounts.sort((a, b) {
          final aName = (a['bank_name'] ?? '').toString().toLowerCase();
          final bName = (b['bank_name'] ?? '').toString().toLowerCase();
          int score(String n) {
            if (n.contains('9psb') || n.contains('9 payment')) return 1;
            if (n.contains('safehaven') || n.contains('safe haven')) return 2;
            if (n.contains('moniepoint')) return 3;
            if (n.contains('palmpay')) return 4;
            if (n.contains('paga') || n.contains('aspfiy')) return 5;
            return 6;
          }
          return score(aName).compareTo(score(bName));
        });

        if (mounted) {
          setState(() {
            _accounts = accounts;
            _loading = false;
            _error = null;
          });
        }
      } else {
        if (mounted) {
          setState(() {
            _accounts = [];
            _loading = false;
            _error = null;
          });
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _loading = false;
          _error = 'Failed to load account details.';
        });
      }
    }
  }

  bool _hasBank(String keyword) {
    final key = keyword.toLowerCase().trim();
    return _accounts.any((acc) {
      final bName = (acc['bank_name'] ?? '').toString().toLowerCase();
      final accNum = (acc['account_number'] ?? '').toString().trim();
      return bName.contains(key) && accNum.isNotEmpty;
    });
  }

  String _formatBankDisplayName(String rawBank) {
    final b = rawBank.trim();
    final lower = b.toLowerCase();
    if (lower.contains('9psb') || lower.contains('9 payment')) {
      return '9 Payment Service Bank (9PSB)';
    }
    if (lower.contains('safehaven') || lower.contains('safe haven')) {
      return 'Safehaven MFB';
    }
    if (lower.contains('moniepoint')) {
      return 'Moniepoint MFB';
    }
    if (lower.contains('palmpay')) {
      return 'PalmPay';
    }
    if (lower.contains('paga') || lower.contains('aspfiy')) {
      return 'Paga';
    }
    if (lower.contains('titan') || lower.contains('paystack')) {
      return 'Paystack-Titan';
    }
    return b;
  }

  void _copyToClipboard(String text) {
    final clean = _formatAccountNumber(text);
    Clipboard.setData(ClipboardData(text: clean));
    HapticFeedback.lightImpact();
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Account number copied to clipboard!'),
        backgroundColor: Color(0xFF10B981),
        duration: Duration(seconds: 2),
      ),
    );
  }

  void _shareDetails(String bank, String accNum, String accName) {
    final clean = _formatAccountNumber(accNum);
    final text = 'Please fund my ${AppConfig.appName} wallet with these details:\n\n'
        'Bank: $bank\n'
        'Account Number: $clean\n'
        'Account Name: $accName';
    Share.share(text);
  }

  // Account number with NO SPACES
  String _formatAccountNumber(String value) {
    return value.replaceAll(RegExp(r'\s+'), '').trim();
  }

  Future<void> _handleCreateWithId() async {
    final idVal = _idController.text.trim();
    final idTypeLabel = _useNin ? 'NIN' : 'BVN';
    final targetBankName = _selectedProviderKey == 'moniepoint' ? 'Moniepoint' : 'PalmPay';

    if (idVal.length != 11) {
      setState(() {
        _inputError = 'Please enter a valid 11-digit $idTypeLabel.';
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Please enter a valid 11-digit $idTypeLabel'),
          backgroundColor: Colors.redAccent,
        ),
      );
      return;
    }

    if (_hasBank(_selectedProviderKey)) {
      setState(() {
        _inputError = 'You already have an active $targetBankName account.';
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('You already have an active $targetBankName account.'),
          backgroundColor: const Color(0xFF10B981),
        ),
      );
      _goToPage(0);
      return;
    }

    final token = (context.read<SessionController>().token ?? '').trim();
    if (token.isEmpty) return;

    setState(() {
      _creating = true;
      _inputError = null;
    });

    try {
      final res = await WalletService(token: token).createBankAccounts(
        nin: _useNin ? idVal : null,
        bvn: !_useNin ? idVal : null,
      );

      final List rawAccs = res['accounts'] ?? [];
      final hasCreatedTarget = rawAccs.any((a) {
        final name = (a['bank_name'] ?? '').toString().toLowerCase();
        return name.contains(_selectedProviderKey);
      });

      if (!hasCreatedTarget && res['message'] != null) {
        final msg = res['message'].toString();
        final lower = msg.toLowerCase();
        if (lower.contains('already') ||
            lower.contains('exist') ||
            lower.contains('duplicate') ||
            lower.contains('linked') ||
            lower.contains('registered')) {
          if (mounted) {
            setState(() {
              _creating = false;
              _inputError = 'This $idTypeLabel is already registered or linked to an account on our platform.';
            });
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('This $idTypeLabel is already registered or linked to an existing account.'),
                backgroundColor: Colors.redAccent,
                duration: const Duration(seconds: 4),
              ),
            );
          }
          return;
        }
      }

      if (mounted) {
        HapticFeedback.mediumImpact();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('$targetBankName virtual account created successfully!'),
            backgroundColor: const Color(0xFF10B981),
            duration: const Duration(seconds: 3),
          ),
        );
        _idController.clear();
        _inputError = null;
        await _loadAccounts(silent: true);
        setState(() => _creating = false);
        _goToPage(0); // Return smoothly to main accounts screen
      }
    } catch (e) {
      if (mounted) {
        setState(() => _creating = false);
        final raw = e.toString().replaceAll("Exception:", "").trim();
        final lower = raw.toLowerCase();
        String friendly;
        if (lower.contains('already') ||
            lower.contains('exist') ||
            lower.contains('duplicate') ||
            lower.contains('linked') ||
            lower.contains('registered')) {
          friendly = 'This $idTypeLabel is already registered or linked to an existing account. Please enter a different $idTypeLabel.';
        } else {
          friendly = raw.isNotEmpty ? raw : 'Failed to create $targetBankName account. Please verify your $idTypeLabel.';
        }
        setState(() {
          _inputError = friendly;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(friendly),
            backgroundColor: Colors.redAccent,
            duration: const Duration(seconds: 4),
          ),
        );
      }
    }
  }

  Future<void> _handleCreateWithoutId(String bankKey) async {
    final token = (context.read<SessionController>().token ?? '').trim();
    if (token.isEmpty) return;

    setState(() => _loading = true);
    _goToPage(0);

    try {
      await WalletService(token: token).createBankAccounts();
      if (mounted) {
        await _loadAccounts(silent: true);
        HapticFeedback.mediumImpact();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Virtual bank account created successfully!'),
            backgroundColor: Color(0xFF10B981),
            duration: Duration(seconds: 3),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() => _loading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: ${e.toString().replaceAll("Exception:", "").trim()}'),
            backgroundColor: Colors.redAccent,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bgColor = isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC);
    final sheetSurfaceColor = isDark ? const Color(0xFF1E293B) : Colors.white;
    final textColor = isDark ? Colors.white : const Color(0xFF0F172A);
    final sheetHeight = MediaQuery.of(context).size.height * 0.80;

    return AnimatedPadding(
      duration: const Duration(milliseconds: 150),
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: ClipRRect(
        borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
        child: Container(
          height: sheetHeight,
          color: bgColor,
          child: SafeArea(
            top: false,
            child: PageView(
              controller: _pageController,
              physics: const NeverScrollableScrollPhysics(),
              children: [
                _buildMainAddBalanceStep(isDark, sheetSurfaceColor, textColor),
                _buildAccountPickerStep(isDark, sheetSurfaceColor, textColor),
                _buildIdInputStep(isDark, sheetSurfaceColor, textColor),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // ==========================================
  // STEP 0: MAIN ADD BALANCE SHEET (Screenshot 1)
  // ==========================================
  Widget _buildMainAddBalanceStep(bool isDark, Color cardColor, Color textColor) {
    return Column(
      children: [
        const SizedBox(height: 12),
        // Handle bar
        Container(
          width: 44,
          height: 4,
          decoration: BoxDecoration(
            color: textColor.withOpacity(0.18),
            borderRadius: BorderRadius.circular(2),
          ),
        ),
        const SizedBox(height: 14),

        // Header: Close | Add Balance | Plus (+)
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              GestureDetector(
                onTap: () => Navigator.pop(context),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(
                    color: textColor.withOpacity(0.06),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: const Text(
                    'Close',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF2563EB),
                    ),
                  ),
                ),
              ),
              Text(
                'Add Balance',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                  color: textColor,
                  letterSpacing: -0.3,
                ),
              ),
              GestureDetector(
                onTap: () {
                  HapticFeedback.lightImpact();
                  _goToPage(1);
                },
                child: Container(
                  width: 38,
                  height: 38,
                  decoration: BoxDecoration(
                    color: textColor.withOpacity(0.06),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.add, color: Color(0xFF2563EB), size: 22),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 14),

        // Accounts list directly (Cards section completely removed)
        Expanded(
          child: _buildAccountsList(isDark, cardColor, textColor),
        ),
      ],
    );
  }

  Widget _buildAccountsList(bool isDark, Color cardColor, Color textColor) {
    if (_loading) {
      return const Center(
        child: CircularProgressIndicator(strokeWidth: 2.5),
      );
    }

    if (_error != null) {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 40, horizontal: 24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, color: Colors.redAccent, size: 40),
            const SizedBox(height: 12),
            Text(_error!, textAlign: TextAlign.center, style: const TextStyle(color: Colors.redAccent)),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () => _loadAccounts(),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF2563EB),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              ),
              child: const Text('Try Again', style: TextStyle(color: Colors.white)),
            ),
          ],
        ),
      );
    }

    return ListView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 6),
      children: [
        // Announcement Banner
        if (!_bannerDismissed) ...[
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF292524) : const Color(0xFFFEF3C7),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: isDark ? const Color(0xFF44403C) : const Color(0xFFFDE68A),
              ),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    color: const Color(0xFFF59E0B).withOpacity(0.2),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.campaign, color: Color(0xFFD97706), size: 18),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'Send money to any of the listed accounts via bank transfer, and it will reflect in your ${AppConfig.appName} wallet.',
                    style: TextStyle(
                      color: isDark ? const Color(0xFFFDE047) : const Color(0xFF92400E),
                      fontSize: 12.5,
                      height: 1.35,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                GestureDetector(
                  onTap: () => setState(() => _bannerDismissed = true),
                  child: Container(
                    padding: const EdgeInsets.all(4),
                    decoration: BoxDecoration(
                      color: Colors.black.withOpacity(0.05),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(Icons.close, size: 14, color: isDark ? Colors.white60 : Colors.black54),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
        ],

        // Accounts List
        if (_accounts.isEmpty) ...[
          Container(
            padding: const EdgeInsets.symmetric(vertical: 40, horizontal: 20),
            decoration: BoxDecoration(
              color: cardColor,
              borderRadius: BorderRadius.circular(20),
            ),
            child: Column(
              children: [
                Icon(Icons.account_balance_wallet_outlined, size: 48, color: textColor.withOpacity(0.3)),
                const SizedBox(height: 12),
                Text(
                  'No virtual accounts yet',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: textColor),
                ),
                const SizedBox(height: 6),
                Text(
                  'Tap the + icon above to generate dedicated virtual bank accounts.',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 13, color: textColor.withOpacity(0.6)),
                ),
              ],
            ),
          ),
        ] else ...[
          ...List.generate(_accounts.length, (index) {
            return _buildBankCard(_accounts[index], isDark, cardColor, textColor);
          }),
        ],
        const SizedBox(height: 24),
      ],
    );
  }

  Widget _buildBankCard(Map<String, dynamic> account, bool isDark, Color cardColor, Color textColor) {
    final rawBank = (account['bank_name'] ?? 'Bank').toString().trim();
    final bankName = _formatBankDisplayName(rawBank);
    final accountNumber = (account['account_number'] ?? '').toString();
    final accountName = (account['account_name'] ?? '').toString();

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: cardColor,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: textColor.withOpacity(0.06)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Bank Header
          Row(
            children: [
              Container(
                width: 38,
                height: 38,
                decoration: BoxDecoration(
                  color: const Color(0xFFEFF6FF),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.account_balance, color: Color(0xFF2563EB), size: 19),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  bankName,
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                    color: textColor,
                    letterSpacing: -0.2,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 18),

          // Subtitle
          Text(
            'Add money via mobile or internet banking',
            style: TextStyle(color: textColor.withOpacity(0.55), fontSize: 13, fontWeight: FontWeight.w500),
          ),
          const SizedBox(height: 8),

          // Big Account Number - NO SPACES
          Text(
            _formatAccountNumber(accountNumber),
            style: TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.w900,
              letterSpacing: 0.5,
              color: textColor,
            ),
          ),
          const SizedBox(height: 20),

          // Action Buttons: Copy Number (Soft Blue) | Share Details (Vibrant Green)
          Row(
            children: [
              Expanded(
                child: GestureDetector(
                  onTap: () => _copyToClipboard(accountNumber),
                  child: Container(
                    height: 44,
                    decoration: BoxDecoration(
                      color: const Color(0xFFEFF6FF),
                      borderRadius: BorderRadius.circular(22),
                    ),
                    child: const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.copy_rounded, color: Color(0xFF2563EB), size: 16),
                        SizedBox(width: 8),
                        Text(
                          'Copy Number',
                          style: TextStyle(
                            color: Color(0xFF2563EB),
                            fontWeight: FontWeight.w700,
                            fontSize: 13.5,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: GestureDetector(
                  onTap: () => _shareDetails(bankName, accountNumber, accountName),
                  child: Container(
                    height: 44,
                    decoration: BoxDecoration(
                      color: const Color(0xFF10B981),
                      borderRadius: BorderRadius.circular(22),
                    ),
                    child: const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.ios_share, color: Colors.white, size: 16),
                        SizedBox(width: 8),
                        Text(
                          'Share Details',
                          style: TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w700,
                            fontSize: 13.5,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // ==========================================
  // STEP 1: ACCOUNT NUMBER PICKER (Screenshot 2)
  // ==========================================
  Widget _buildAccountPickerStep(bool isDark, Color cardColor, Color textColor) {
    final has9psb = _hasBank('9psb') || _hasBank('9 payment');
    final hasSafehaven = _hasBank('safehaven');
    final hasPaga = _hasBank('paga') || _hasBank('aspfiy');
    final hasNoBvnGroup = has9psb || hasSafehaven || hasPaga;

    final hasMoniepoint = _hasBank('moniepoint');
    final hasPalmpay = _hasBank('palmpay');

    return Column(
      children: [
        const SizedBox(height: 12),
        Center(
          child: Container(
            width: 44,
            height: 4,
            decoration: BoxDecoration(
              color: textColor.withOpacity(0.18),
              borderRadius: BorderRadius.circular(2),
            ),
          ),
        ),
        const SizedBox(height: 14),

        // Header: Cancel (left) | Account number (center)
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              GestureDetector(
                onTap: () => _goToPage(0),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(
                    color: textColor.withOpacity(0.06),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: const Text(
                    'Cancel',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF2563EB),
                    ),
                  ),
                ),
              ),
              Text(
                'Account number',
                style: TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.w700,
                  color: textColor,
                ),
              ),
              const SizedBox(width: 65), // balance header
            ],
          ),
        ),
        const SizedBox(height: 20),

        // Hero title
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Align(
            alignment: Alignment.centerLeft,
            child: RichText(
              text: TextSpan(
                style: TextStyle(
                  fontSize: 23,
                  color: textColor,
                  fontWeight: FontWeight.w400,
                  letterSpacing: -0.5,
                ),
                children: const [
                  TextSpan(
                    text: 'Account. ',
                    style: TextStyle(fontWeight: FontWeight.w900),
                  ),
                  TextSpan(text: 'Which one works for you?'),
                ],
              ),
            ),
          ),
        ),
        const SizedBox(height: 16),

        // Options Cards List
        Expanded(
          child: ListView(
            physics: const BouncingScrollPhysics(),
            padding: const EdgeInsets.fromLTRB(20, 6, 20, 20),
            children: [
              // SECTION 1: No BVN needed
              _buildPickerSectionCard(
                isDark: isDark,
                cardColor: cardColor,
                textColor: textColor,
                title: 'No BVN needed',
                subtitle: 'Ready in seconds',
                isOwned: hasNoBvnGroup,
                children: [
                  _buildPickerOptionRow(
                    textColor: textColor,
                    bankName: '9 Payment Service Bank (9PSB)',
                    subName: '9PSB Bank',
                    isOwned: has9psb,
                    isSelected: false,
                    onTap: () {
                      if (has9psb) {
                        _goToPage(0);
                      } else {
                        _handleCreateWithoutId('9psb');
                      }
                    },
                  ),
                  _buildDivider(textColor),
                  _buildPickerOptionRow(
                    textColor: textColor,
                    bankName: 'Safehaven MFB',
                    subName: 'Safehaven MFB',
                    isOwned: hasSafehaven,
                    isSelected: false,
                    onTap: () {
                      if (hasSafehaven) {
                        _goToPage(0);
                      } else {
                        _handleCreateWithoutId('safehaven');
                      }
                    },
                  ),
                  _buildDivider(textColor),
                  _buildPickerOptionRow(
                    textColor: textColor,
                    bankName: 'Paga',
                    subName: 'Paga (Instant)',
                    isOwned: hasPaga,
                    isSelected: false,
                    onTap: () {
                      if (hasPaga) {
                        _goToPage(0);
                      } else {
                        _handleCreateWithoutId('paga');
                      }
                    },
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // SECTION 2: NIN required
              _buildPickerSectionCard(
                isDark: isDark,
                cardColor: cardColor,
                textColor: textColor,
                title: 'NIN required',
                subtitle: 'Verified safely with your 11-digit NIN',
                isOwned: hasMoniepoint && hasPalmpay,
                children: [
                  _buildPickerOptionRow(
                    textColor: textColor,
                    bankName: 'Moniepoint',
                    subName: 'Opens with your NIN or BVN',
                    isOwned: hasMoniepoint,
                    isSelected: !hasMoniepoint && _selectedProviderKey == 'moniepoint',
                    onTap: () {
                      if (hasMoniepoint) {
                        _goToPage(0);
                      } else {
                        setState(() => _selectedProviderKey = 'moniepoint');
                        _goToPage(2);
                      }
                    },
                  ),
                  _buildDivider(textColor),
                  _buildPickerOptionRow(
                    textColor: textColor,
                    bankName: 'PalmPay',
                    subName: 'Opens with your NIN or BVN',
                    isOwned: hasPalmpay,
                    isSelected: !hasPalmpay && _selectedProviderKey == 'palmpay',
                    onTap: () {
                      if (hasPalmpay) {
                        _goToPage(0);
                      } else {
                        setState(() => _selectedProviderKey = 'palmpay');
                        _goToPage(2);
                      }
                    },
                  ),
                ],
              ),
              const SizedBox(height: 20),
            ],
          ),
        ),

        // Bottom Button: "Show my number"
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Column(
            children: [
              SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton(
                  onPressed: () {
                    HapticFeedback.lightImpact();
                    if (_selectedProviderKey == 'moniepoint' && !hasMoniepoint) {
                      _goToPage(2);
                    } else if (_selectedProviderKey == 'palmpay' && !hasPalmpay) {
                      _goToPage(2);
                    } else {
                      _goToPage(0);
                    }
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF2563EB),
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(26),
                    ),
                  ),
                  child: Text(
                    (!hasMoniepoint && _selectedProviderKey == 'moniepoint') ||
                            (!hasPalmpay && _selectedProviderKey == 'palmpay')
                        ? 'Continue with NIN'
                        : 'Show my number',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 10),
              Text(
                'Money you transfer to your ${AppConfig.appName} account number lands in your wallet.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: textColor.withOpacity(0.5),
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 14),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildPickerSectionCard({
    required bool isDark,
    required Color cardColor,
    required Color textColor,
    required String title,
    required String subtitle,
    required bool isOwned,
    required List<Widget> children,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: cardColor,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isOwned ? const Color(0xFF2563EB) : textColor.withOpacity(0.08),
          width: isOwned ? 1.5 : 1.0,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Section Header
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 12),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                          color: textColor,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        subtitle,
                        style: TextStyle(
                          fontSize: 12,
                          color: textColor.withOpacity(0.55),
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    if (isOwned) ...[
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: const Color(0xFFDCFCE7),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Text(
                          'You have this',
                          style: TextStyle(
                            color: Color(0xFF16A34A),
                            fontSize: 10.5,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                      const SizedBox(width: 6),
                    ],
                    const Text(
                      'Free',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF10B981),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          _buildDivider(textColor),
          // Bank Rows
          ...children,
        ],
      ),
    );
  }

  Widget _buildPickerOptionRow({
    required Color textColor,
    required String bankName,
    required String subName,
    required bool isOwned,
    required bool isSelected,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Row(
          children: [
            Container(
              width: 38,
              height: 38,
              decoration: BoxDecoration(
                color: const Color(0xFFEFF6FF),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(Icons.account_balance, color: Color(0xFF2563EB), size: 19),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    bankName,
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                      color: textColor,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subName,
                    style: TextStyle(
                      fontSize: 12,
                      color: textColor.withOpacity(0.5),
                    ),
                  ),
                ],
              ),
            ),
            if (isOwned)
              Container(
                width: 24,
                height: 24,
                decoration: const BoxDecoration(
                  color: Color(0xFF10B981),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.check, color: Colors.white, size: 16),
              )
            else
              Container(
                width: 22,
                height: 22,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: isSelected ? const Color(0xFF2563EB) : textColor.withOpacity(0.25),
                    width: isSelected ? 5.5 : 1.5,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildDivider(Color textColor) {
    return Divider(
      height: 1,
      thickness: 1,
      color: textColor.withOpacity(0.06),
    );
  }

  // ==========================================
  // STEP 2: YOUR NIN/BVN INPUT (Screenshot 3)
  // ==========================================
  Widget _buildIdInputStep(bool isDark, Color cardColor, Color textColor) {
    final idLength = _idController.text.trim().length;
    final isReady = idLength == 11;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 12),
        Center(
          child: Container(
            width: 44,
            height: 4,
            decoration: BoxDecoration(
              color: textColor.withOpacity(0.18),
              borderRadius: BorderRadius.circular(2),
            ),
          ),
        ),
        const SizedBox(height: 14),

        // Header: Back (left) | Account number (center)
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              GestureDetector(
                onTap: () => _goToPage(1),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(
                    color: textColor.withOpacity(0.06),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: const Text(
                    'Back',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF2563EB),
                    ),
                  ),
                ),
              ),
              Text(
                'Account number',
                style: TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.w700,
                  color: textColor,
                ),
              ),
              const SizedBox(width: 55), // balance
            ],
          ),
        ),
        const SizedBox(height: 20),

        // Mode Toggle: NIN (Recommended) | BVN
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Container(
            padding: const EdgeInsets.all(4),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF1E293B) : const Color(0xFFE2E8F0).withOpacity(0.6),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Row(
              children: [
                Expanded(
                  child: GestureDetector(
                    onTap: () {
                      if (!_useNin) {
                        HapticFeedback.selectionClick();
                        setState(() {
                          _useNin = true;
                          _idController.clear();
                        });
                      }
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 9),
                      decoration: BoxDecoration(
                        color: _useNin ? const Color(0xFF2563EB) : Colors.transparent,
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: _useNin
                            ? [
                                BoxShadow(
                                  color: const Color(0xFF2563EB).withOpacity(0.3),
                                  blurRadius: 6,
                                  offset: const Offset(0, 2),
                                ),
                              ]
                            : [],
                      ),
                      child: const Center(
                        child: Text(
                          'NIN (Recommended)',
                          style: TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w700,
                            fontSize: 13,
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
                Expanded(
                  child: GestureDetector(
                    onTap: () {
                      if (_useNin) {
                        HapticFeedback.selectionClick();
                        setState(() {
                          _useNin = false;
                          _idController.clear();
                        });
                      }
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 9),
                      decoration: BoxDecoration(
                        color: !_useNin ? (isDark ? const Color(0xFF334155) : Colors.white) : Colors.transparent,
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: !_useNin
                            ? [
                                BoxShadow(
                                  color: Colors.black.withOpacity(0.05),
                                  blurRadius: 4,
                                  offset: const Offset(0, 2),
                                ),
                              ]
                            : [],
                      ),
                      child: Center(
                        child: Text(
                          'BVN',
                          style: TextStyle(
                            color: !_useNin ? textColor : textColor.withOpacity(0.55),
                            fontWeight: FontWeight.w700,
                            fontSize: 13,
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 24),

        // Title: "Your NIN" or "Your BVN"
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Text(
            _useNin ? 'Your NIN' : 'Your BVN',
            style: TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.w900,
              color: textColor,
              letterSpacing: -0.5,
            ),
          ),
        ),
        const SizedBox(height: 10),

        // Subtitle explanation
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Text(
            _useNin
                ? 'Your bank needs your National Identity Number to open the account in your name. NIN is 100% safe, verified once, and never stored.'
                : 'Your bank needs this to open the account in your name. We send it once and never store it.',
            style: TextStyle(
              fontSize: 14,
              height: 1.45,
              color: textColor.withOpacity(0.6),
              fontWeight: FontWeight.w500,
            ),
          ),
        ),
        const SizedBox(height: 24),

        // 11-digit Input Field
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 4),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF1E293B) : Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: _inputError != null
                    ? const Color(0xFFDC2626)
                    : (isReady
                        ? const Color(0xFF2563EB)
                        : textColor.withOpacity(0.12)),
                width: (_inputError != null || isReady) ? 1.5 : 1.0,
              ),
            ),
            child: TextField(
              controller: _idController,
              keyboardType: TextInputType.number,
              maxLength: 11,
              style: TextStyle(
                fontSize: 20,
                letterSpacing: 2.0,
                fontWeight: FontWeight.w700,
                color: textColor,
              ),
              inputFormatters: [
                FilteringTextInputFormatter.digitsOnly,
              ],
              decoration: InputDecoration(
                border: InputBorder.none,
                enabledBorder: InputBorder.none,
                focusedBorder: InputBorder.none,
                errorBorder: InputBorder.none,
                focusedErrorBorder: InputBorder.none,
                disabledBorder: InputBorder.none,
                filled: false,
                isDense: true,
                contentPadding: const EdgeInsets.symmetric(vertical: 14),
                counterText: '',
                hintText: _useNin ? '11-digit  NIN' : '11-digit  BVN',
                hintStyle: TextStyle(
                  fontSize: 18,
                  letterSpacing: 1.5,
                  fontWeight: FontWeight.w500,
                  color: textColor.withOpacity(0.3),
                ),
              ),
            ),
          ),
        ),

        // Inline Error Message (if any)
        if (_inputError != null) ...[
          const SizedBox(height: 12),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF450A0A) : const Color(0xFFFEF2F2),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFFCA5A5)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.error_outline, color: Color(0xFFDC2626), size: 18),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      _inputError!,
                      style: TextStyle(
                        color: isDark ? const Color(0xFFFCA5A5) : const Color(0xFFB91C1C),
                        fontSize: 12.5,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
        const Spacer(),

        // Bottom Button: "Create it"
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: SizedBox(
            width: double.infinity,
            height: 52,
            child: ElevatedButton(
              onPressed: (isReady && !_creating) ? _handleCreateWithId : null,
              style: ElevatedButton.styleFrom(
                backgroundColor: isReady ? const Color(0xFF2563EB) : const Color(0xFF94A3B8),
                disabledBackgroundColor: isDark ? const Color(0xFF334155) : const Color(0xFFCBD5E1),
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(26),
                ),
              ),
              child: _creating
                  ? const SizedBox(
                      width: 22,
                      height: 22,
                      child: CircularProgressIndicator(
                        strokeWidth: 2.5,
                        color: Colors.white,
                      ),
                    )
                  : Text(
                      'Create it',
                      style: TextStyle(
                        color: isReady ? Colors.white : Colors.white70,
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
            ),
          ),
        ),
        const SizedBox(height: 20),
      ],
    );
  }
}
