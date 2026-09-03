function normalizeBase(raw) {
  return String(raw || '').trim().replace(/\/+$/, '');
}

export function getSiteOrigin() {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }

  const env = normalizeBase(process.env.NEXT_PUBLIC_SITE_URL);
  if (env) return env;

  return 'https://mzdata.ng';
}

export function buildReferralUrl(code) {
  const value = String(code || '').trim();
  if (!value) return '';
  return `${getSiteOrigin()}/register?ref=${encodeURIComponent(value)}`;
}
