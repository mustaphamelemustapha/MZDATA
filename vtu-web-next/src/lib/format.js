export function formatMoney(value) {
  const num = Number(value ?? 0);
  if (!Number.isFinite(num)) return '0.00';
  return num.toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatCompactDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-NG', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return `${formatCompactDate(date)} • ${date.toLocaleTimeString('en-NG', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
}

export function shortMonth(month) {
  return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][month - 1] || 'Dec';
}

export function formatBankDisplayName(rawName) {
  if (!rawName) return 'Bank';
  const name = String(rawName).trim();
  const lower = name.toLowerCase();
  if (lower.includes('9psb') || lower.includes('9 payment')) {
    return '9 Payment Service Bank (9PSB)';
  }
  if (lower.includes('safehaven') || lower.includes('safe haven')) {
    return 'Safehaven Microfinance Bank';
  }
  if (lower.includes('moniepoint') || lower.includes('monnify')) {
    return 'Moniepoint Microfinance Bank';
  }
  if (lower.includes('palmpay')) {
    return 'PalmPay';
  }
  if (lower.includes('titan') || lower.includes('paystack')) {
    return 'Titan Trust Bank';
  }
  if (lower.includes('paga') || lower.includes('aspfiy') || lower.includes('aspify')) {
    return 'Paga';
  }
  if (lower.includes('wema')) {
    return 'Wema Bank';
  }
  if (lower.includes('sterling')) {
    return 'Sterling Bank';
  }
  return name;
}

export function getBankAppSearchHint(rawName) {
  const lower = String(rawName || '').toLowerCase();
  if (lower.includes('palmpay')) return 'Select "PalmPay" in your bank app';
  if (lower.includes('moniepoint') || lower.includes('monnify')) return 'Select "Moniepoint MFB" or "Moniepoint"';
  if (lower.includes('safehaven') || lower.includes('safe haven')) return 'Select "Safe Haven MFB" or "Safe Haven Microfinance Bank"';
  if (lower.includes('9psb') || lower.includes('9 payment')) return 'Select "9 Payment Service Bank" or "9PSB"';
  if (lower.includes('titan') || lower.includes('paystack')) return 'Select "Titan Trust Bank"';
  if (lower.includes('paga')) return 'Select "Paga"';
  return `Select "${formatBankDisplayName(rawName)}" in your bank app`;
}

export function formatAccountNumber(number) {
  const clean = String(number || '').replace(/\D/g, '');
  if (clean.length === 10) {
    return `${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6)}`;
  }
  return number || '';
}

export function sortFundingAccounts(accounts = []) {
  if (!Array.isArray(accounts)) return [];
  const score = (acc) => {
    const lower = String(acc?.bank_name || '').toLowerCase();
    if (lower.includes('palmpay')) return 1;
    if (lower.includes('moniepoint') || lower.includes('monnify')) return 2;
    if (lower.includes('safehaven') || lower.includes('safe haven')) return 3;
    if (lower.includes('titan') || lower.includes('paystack')) return 4;
    if (lower.includes('9psb') || lower.includes('9 payment')) return 5;
    return 6;
  };
  return [...accounts].sort((a, b) => score(a) - score(b));
}

export function getBankStyle(rawName) {
  const lower = String(rawName || '').toLowerCase();
  if (lower.includes('palmpay')) {
    return {
      badgeBg: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30',
      iconBg: 'bg-purple-600 text-white',
      accentColor: 'text-purple-600 dark:text-purple-400',
      borderAccent: 'border-purple-500/30',
      shortName: 'PalmPay',
    };
  }
  if (lower.includes('moniepoint') || lower.includes('monnify')) {
    return {
      badgeBg: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
      iconBg: 'bg-blue-600 text-white',
      accentColor: 'text-blue-600 dark:text-blue-400',
      borderAccent: 'border-blue-500/30',
      shortName: 'Moniepoint',
    };
  }
  if (lower.includes('safehaven') || lower.includes('safe haven')) {
    return {
      badgeBg: 'bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30',
      iconBg: 'bg-teal-600 text-white',
      accentColor: 'text-teal-600 dark:text-teal-400',
      borderAccent: 'border-teal-500/30',
      shortName: 'Safe Haven',
    };
  }
  if (lower.includes('9psb') || lower.includes('9 payment')) {
    return {
      badgeBg: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
      iconBg: 'bg-amber-600 text-white',
      accentColor: 'text-amber-600 dark:text-amber-400',
      borderAccent: 'border-amber-500/30',
      shortName: '9PSB',
    };
  }
  return {
    badgeBg: 'bg-primary/15 text-primary border-primary/30',
    iconBg: 'bg-primary text-primary-foreground',
    accentColor: 'text-primary',
    borderAccent: 'border-primary/30',
    shortName: 'Bank',
  };
}
