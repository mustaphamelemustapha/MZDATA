import { filterAllowedAmigoPlans } from '@/lib/amigo-plan-policy';
const PLAN_CACHE_KEY = 'mzdata_data_plans_cache_v4';
const PLAN_CACHE_TTL_MS = 5 * 1000;
const PLAN_REQUEST_TIMEOUT_MS = 18000;

let inFlightPlansPromise = null;

function parsePlansResponse(raw) {
  if (Array.isArray(raw)) return filterAllowedAmigoPlans(raw);
  if (!raw || typeof raw !== 'object') return [];
  // Robustly find the list of plans in common wrapper objects
  const list = raw.plans ?? raw.data ?? raw.items ?? (Array.isArray(raw.results) ? raw.results : []);
  return Array.isArray(list) ? filterAllowedAmigoPlans(list) : [];
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function now() {
  return Date.now();
}

function safeReadCache() {
  if (typeof window === 'undefined') return { timestamp: 0, plans: [] };
  try {
    const parsed = JSON.parse(window.localStorage.getItem(PLAN_CACHE_KEY) || '{}');
    const timestamp = Number(parsed?.timestamp || 0);
    const plans = Array.isArray(parsed?.plans) ? parsed.plans : [];
    return { timestamp, plans };
  } catch {
    return { timestamp: 0, plans: [] };
  }
}

export function readCachedDataPlans({ allowStale = true } = {}) {
  const { timestamp, plans } = safeReadCache();
  if (!plans.length) return [];
  const filteredPlans = filterAllowedAmigoPlans(plans);
  if (allowStale) return filteredPlans;
  if (now() - timestamp > PLAN_CACHE_TTL_MS) return [];
  return filteredPlans;
}

export function writeCachedDataPlans(plans) {
  if (typeof window === 'undefined' || !Array.isArray(plans) || !plans.length) return;
  const filteredPlans = filterAllowedAmigoPlans(plans);
  if (!filteredPlans.length) return;
  try {
    window.localStorage.setItem(
      PLAN_CACHE_KEY,
      JSON.stringify({
        timestamp: now(),
        plans: filteredPlans,
      })
    );
  } catch {
    // ignore storage errors
  }
}

async function requestLivePlans(apiFetchFn) {
  return Promise.race([
    apiFetchFn('/data/plans'),
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Timed out while loading data plans.')), PLAN_REQUEST_TIMEOUT_MS);
    }),
  ]);
}

async function fetchLivePlansWithRetry(apiFetchFn) {
  try {
    return await requestLivePlans(apiFetchFn);
  } catch (firstError) {
    await wait(650);
    return requestLivePlans(apiFetchFn).catch(() => {
      throw firstError;
    });
  }
}

export async function prefetchDataPlans(apiFetchFn) {
  if (typeof apiFetchFn !== 'function') return [];
  if (inFlightPlansPromise) return inFlightPlansPromise;
  inFlightPlansPromise = (async () => {
    const raw = await fetchLivePlansWithRetry(apiFetchFn);
    const plans = parsePlansResponse(raw);
    if (plans.length) writeCachedDataPlans(plans);
    return plans;
  })().finally(() => {
    inFlightPlansPromise = null;
  });
  return inFlightPlansPromise;
}

export async function getDataPlansFast(apiFetchFn, { forceRefresh = true } = {}) {
  // forceRefresh = true by default now to bypass any stale localStorage cache
  if (forceRefresh) {
    const live = await prefetchDataPlans(apiFetchFn);
    return { plans: live, source: 'live' };
  }

  const freshCache = readCachedDataPlans({ allowStale: false });
  if (freshCache.length) {
    return { plans: freshCache, source: 'cache' };
  }

  const live = await prefetchDataPlans(apiFetchFn);
  return { plans: live, source: 'live' };
}
