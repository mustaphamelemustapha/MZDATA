const AIRTEL_AMIGO_ALLOWED_CODES = new Set(['163', '145', '146', '532', '148', '150', '405', '404']);

function normalizeNetwork(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return '';
  if (raw.includes('9mobile') || raw.includes('etisalat') || raw === '9') return '9mobile';
  if (raw.includes('mtn')) return 'mtn';
  if (raw.includes('airtel')) return 'airtel';
  if (raw.includes('glo') || raw.includes('globacom')) return 'glo';
  return raw;
}

function extractPlanCodeId(planCode) {
  const raw = String(planCode || '').trim().toLowerCase();
  if (!raw) return '';
  return raw.includes(':') ? raw.split(':').pop() : raw;
}

export function filterAllowedAmigoPlans(rows) {
  if (!Array.isArray(rows)) return [];
  return rows.filter((item) => {
    const network = normalizeNetwork(item?.network || item?.provider || item?.plan_code || '');
    if (network !== 'airtel') return true;

    // We now allow all Airtel plans to support SMEPlug and full administrative control 
    // via the backend dashboard. The backend already filters by is_active=True.
    return true;
  });
}

export function isAirtelAmigoPlanCode(planCode) {
  return AIRTEL_AMIGO_ALLOWED_CODES.has(extractPlanCodeId(planCode));
}
