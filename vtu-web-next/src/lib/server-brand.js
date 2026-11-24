import { headers } from 'next/headers';
import { BRANDS } from './brand';

/**
 * Resolves the active brand on the server from the incoming Host / X-Forwarded-Host header
 * or build/runtime environment variables.
 */
export function resolveServerBrand() {
  try {
    const hdrs = headers();
    const host = (
      hdrs.get('x-forwarded-host') ||
      hdrs.get('host') ||
      ''
    ).toLowerCase();

    if (host.includes('kulloma')) return BRANDS.kullomaData;
    if (host.includes('mzdata')) return BRANDS.mzData;
    if (host.includes('meledata')) return BRANDS.meleData;
  } catch {
    // Static build fallback when request context is unavailable
  }

  const envBrand = (
    process.env.NEXT_PUBLIC_APP_BRAND ||
    process.env.BRAND_NAME ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    ''
  ).toLowerCase();

  if (envBrand.includes('kulloma')) return BRANDS.kullomaData;
  if (envBrand.includes('mz')) return BRANDS.mzData;

  return BRANDS.meleData;
}
