class PhoneValidationResult {
  final bool isValid;
  final String? error;
  final String cleanPhone;

  const PhoneValidationResult({
    required this.isValid,
    this.error,
    required this.cleanPhone,
  });
}

class PhoneValidator {
  static const Set<String> _validPrefixes = {
    '070',
    '080',
    '081',
    '090',
    '091',
  };

  /// Cleans raw input by removing spaces, hyphens, and parentheses.
  static String clean(String raw) {
    return raw.replaceAll(RegExp(r'[\s\-\(\)]'), '');
  }

  /// Intelligently normalizes Nigerian phone numbers:
  /// - Strips +234 or 234 and prepends 0
  /// - If 10 digits starting with 7, 8, or 9 (user entered without 0), prepends 0
  /// - Strips spaces, parentheses, hyphens
  static String normalize(String raw) {
    String cleaned = clean(raw.trim());
    if (cleaned.startsWith('+234')) {
      cleaned = '0${cleaned.substring(4)}';
    } else if (cleaned.startsWith('234') && cleaned.length >= 12) {
      cleaned = '0${cleaned.substring(3)}';
    } else if (cleaned.length == 10 &&
        (cleaned.startsWith('7') || cleaned.startsWith('8') || cleaned.startsWith('9'))) {
      cleaned = '0$cleaned';
    }
    return cleaned;
  }

  /// Validates a Nigerian phone number with smart auto-normalization:
  /// - Seamlessly accepts +234, 234, or standard 080/081/070/090/091
  /// - Ensures 11 digits
  /// - Validates Nigerian mobile network prefixes
  static PhoneValidationResult validate(String raw) {
    final trimmed = raw.trim();
    if (trimmed.isEmpty) {
      return const PhoneValidationResult(
        isValid: false,
        error: 'Please enter your phone number',
        cleanPhone: '',
      );
    }

    // Check if user entered country code format
    if (trimmed.startsWith('+234') || trimmed.startsWith('234')) {
      return const PhoneValidationResult(
        isValid: false,
        error: 'Enter your number starting with 0',
        cleanPhone: '',
      );
    }

    final normalized = normalize(trimmed);

    // Check for non-digit characters in normalized result
    if (!RegExp(r'^[0-9]+$').hasMatch(normalized)) {
      return PhoneValidationResult(
        isValid: false,
        error: 'Phone number can only contain digits',
        cleanPhone: normalized,
      );
    }

    if (!normalized.startsWith('0')) {
      return PhoneValidationResult(
        isValid: false,
        error: 'Enter your number starting with 0',
        cleanPhone: normalized,
      );
    }

    if (normalized.length < 11) {
      return PhoneValidationResult(
        isValid: false,
        error: 'Phone number must be 11 digits (${normalized.length}/11)',
        cleanPhone: normalized,
      );
    }

    if (normalized.length > 11) {
      return PhoneValidationResult(
        isValid: false,
        error: 'Phone number must be exactly 11 digits',
        cleanPhone: normalized,
      );
    }

    final prefix = normalized.substring(0, 3);
    if (!_validPrefixes.contains(prefix)) {
      return PhoneValidationResult(
        isValid: false,
        error: 'Please enter a valid Nigerian network number (e.g. 080, 081, 070, 090, 091)',
        cleanPhone: normalized,
      );
    }

    return PhoneValidationResult(
      isValid: true,
      error: null,
      cleanPhone: normalized,
    );
  }
}

