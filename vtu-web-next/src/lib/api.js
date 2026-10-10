const DEFAULT_API_BASE = 'https://mzdata-1.onrender.com/api/v1';
const TOKEN_KEY = 'mzdata_access_token';
const REFRESH_KEY = 'mzdata_refresh_token';
const PROFILE_KEY = 'mzdata_profile';
const ACTIVE_SCOPE_KEY = 'mzdata_active_scope';
const CACHE_PREFIX = 'mzdata_cache_v1:';

let refreshPromise = null;

function normalizeBase(raw) {
  return String(raw || '').trim().replace(/\/+$/, '');
}

function getApiBase() {
  const env = typeof window !== 'undefined' ? window.__MELEDATA_API_BASE__ : undefined;
  const candidate = normalizeBase(
    env || 
    process.env.NEXT_PUBLIC_API_BASE || 
    process.env.NEXT_PUBLIC_API_BASE_URL || 
    DEFAULT_API_BASE
  );
  if (typeof window !== 'undefined' && window.location.protocol === 'https:' && candidate.startsWith('http://')) {
    return `https://${candidate.slice('http://'.length)}`;
  }
  return candidate || DEFAULT_API_BASE;
}

function safeJson(raw, fallback) {
  try {
    const parsed = JSON.parse(raw || '');
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function canUseStorage() {
  return typeof window !== 'undefined';
}

export function getToken() {
  if (!canUseStorage()) return '';
  return window.localStorage.getItem(TOKEN_KEY) || window.sessionStorage.getItem(TOKEN_KEY) || '';
}

export function getRefreshToken() {
  if (!canUseStorage()) return '';
  return window.localStorage.getItem(REFRESH_KEY) || window.sessionStorage.getItem(REFRESH_KEY) || '';
}

export function setAuthTokens(accessToken, refreshToken, persist = true) {
  if (!canUseStorage()) return;
  if (persist) {
    window.localStorage.setItem(TOKEN_KEY, accessToken);
    window.localStorage.setItem(REFRESH_KEY, refreshToken || '');
    window.sessionStorage.removeItem(TOKEN_KEY);
    window.sessionStorage.removeItem(REFRESH_KEY);
  } else {
    window.sessionStorage.setItem(TOKEN_KEY, accessToken);
    window.sessionStorage.setItem(REFRESH_KEY, refreshToken || '');
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(REFRESH_KEY);
  }
}

export function clearAuth() {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_KEY);
  window.sessionStorage.removeItem(TOKEN_KEY);
  window.sessionStorage.removeItem(REFRESH_KEY);
  window.localStorage.removeItem(PROFILE_KEY);
  window.localStorage.removeItem(ACTIVE_SCOPE_KEY);
}

export function setProfile(profile) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile || {}));
  const scope = String(profile?.email || profile?.full_name || '').trim().toLowerCase();
  window.localStorage.setItem(ACTIVE_SCOPE_KEY, scope);
}

export function getProfile() {
  if (!canUseStorage()) return {};
  return safeJson(window.localStorage.getItem(PROFILE_KEY), {});
}

export function getActiveAuthScope() {
  if (!canUseStorage()) return 'guest';
  const email = String(getProfile()?.email || '').trim().toLowerCase();
  if (email) return email;
  const scope = String(window.localStorage.getItem(ACTIVE_SCOPE_KEY) || '').trim().toLowerCase();
  return scope || 'guest';
}

function getScopedCacheKey(key) {
  return `${CACHE_PREFIX}${getActiveAuthScope()}:${String(key || '').trim()}`;
}

export function writeScopedCache(key, data) {
  if (!canUseStorage()) return;
  const resolvedKey = getScopedCacheKey(key);
  if (!resolvedKey) return;
  try {
    window.localStorage.setItem(
      resolvedKey,
      JSON.stringify({
        updatedAt: Date.now(),
        data,
      })
    );
  } catch {
    // Ignore cache write failures.
  }
}

export function readScopedCache(key, options = {}) {
  if (!canUseStorage()) return null;
  const maxAgeMs = typeof options.maxAgeMs === 'number' ? options.maxAgeMs : 3 * 60 * 1000;
  const resolvedKey = getScopedCacheKey(key);
  if (!resolvedKey) return null;
  try {
    const raw = window.localStorage.getItem(resolvedKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const updatedAt = Number(parsed?.updatedAt || 0);
    if (!updatedAt || Date.now() - updatedAt > maxAgeMs) return null;
    return parsed?.data ?? null;
  } catch {
    return null;
  }
}

function parseError(data) {
  if (Array.isArray(data?.detail)) {
    return data.detail
      .map((item) => {
        if (item && typeof item === 'object') {
          const loc = Array.isArray(item.loc) ? item.loc[item.loc.length - 1] : '';
          return [loc, item.msg].filter(Boolean).join(': ');
        }
        return String(item || '');
      })
      .filter(Boolean)
      .join(', ');
  }
  if (typeof data?.detail === 'string') return data.detail;
  if (typeof data?.message === 'string') return data.message;
  return 'Request failed';
}

function makeError(message, code) {
  const err = new Error(message);
  if (code) err.code = code;
  return err;
}

async function refreshAccessToken() {
  if (refreshPromise) return refreshPromise;
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw makeError('Session expired. Please log in again.', 'AUTH_EXPIRED');
  refreshPromise = (async () => {
    const res = await fetch(`${getApiBase()}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
      cache: 'no-store',
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.access_token) {
      throw makeError('Session expired. Please log in again.', 'AUTH_EXPIRED');
    }
    setAuthTokens(data.access_token, data.refresh_token, !!window.localStorage.getItem(TOKEN_KEY));
    return data.access_token;
  })().finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
}

export async function apiFetch(path, options = {}) {
  const base = getApiBase();
  const method = String(options.method || 'GET').toUpperCase();
  const timeoutMs =
    typeof options.timeoutMs === 'number'
      ? options.timeoutMs
      : method === 'GET'
        ? 20000
        : 30000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  const headers = { ...(options.headers || {}) };
  const token = getToken();
  if (token && !headers.Authorization) headers.Authorization = `Bearer ${token}`;
  if (options.body && !headers['Content-Type'] && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  let res;
  try {
    res = await fetch(`${base}${path}`, {
      method,
      headers,
      body: options.body,
      cache: 'no-store',
      signal: controller.signal,
    });
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw makeError('Request timed out. Please try again.', 'REQUEST_TIMEOUT');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
  if (res.status === 401 && path !== '/auth/login' && path !== '/auth/refresh') {
    try {
      await refreshAccessToken();
      return apiFetch(path, {
        ...options,
        headers: { ...headers, Authorization: `Bearer ${getToken()}` },
      });
    } catch (err) {
      clearAuth();
      throw err;
    }
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw makeError(parseError(data));
  }
  return data;
}

export async function warmBackend() {
  try {
    const base = getApiBase().replace(/\/api\/v1\/?$/, '');
    const res = await fetch(`${base}/healthz`, { cache: 'no-store' });
    return res.ok;
  } catch {
    return false;
  }
}

export async function loginRequest(email, password) {
  return apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function registerRequest(payload) {
  return apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function forgotPasswordRequest(email) {
  return apiFetch('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function resetPasswordRequest(token, password) {
  return apiFetch('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, new_password: password }),
  });
}

export async function resetPinRequest(token, pin) {
  return apiFetch('/security/pin/reset-confirm', {
    method: 'POST',
    body: JSON.stringify({ token, new_pin: pin, confirm_pin: pin }),
  });
}

function toQuery(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    search.set(key, String(value));
  });
  const query = search.toString();
  return query ? `?${query}` : '';
}

export async function adminGetAnalytics() {
  return apiFetch('/admin/analytics');
}

export async function adminGetUsers(params = {}) {
  return apiFetch(`/admin/users${toQuery(params)}`);
}

export async function adminGetUserDetails(userId) {
  return apiFetch(`/admin/users/${userId}/details`);
}

export async function adminSuspendUser(userId) {
  return apiFetch(`/admin/users/${userId}/suspend`, { method: 'POST' });
}

export async function adminActivateUser(userId) {
  return apiFetch(`/admin/users/${userId}/activate`, { method: 'POST' });
}

export async function adminUpdateUserRole(payload) {
  return apiFetch(`/admin/users/update-role`, {
    method: 'POST',
    body: JSON.stringify(payload || {}),
  });
}

export async function adminDeleteUser(userId) {
  return apiFetch(`/admin/users/${userId}`, { method: 'DELETE' });
}

export async function adminApproveDeveloper(userId) {
  return apiFetch(`/admin/developers/${userId}/approve`, { method: 'POST' });
}

export async function adminSuspendDeveloper(userId) {
  return apiFetch(`/admin/developers/${userId}/suspend`, { method: 'POST' });
}


export async function adminGetTransactions(params = {}) {
  return apiFetch(`/admin/transactions${toQuery(params)}`);
}

export async function adminGetTransactionDetails(reference) {
  return apiFetch(`/admin/transactions/${encodeURIComponent(reference)}`);
}

export async function adminGetReports(params = {}) {
  return apiFetch(`/admin/reports${toQuery(params)}`);
}

export async function adminUpdateReport(reportId, payload) {
  return apiFetch(`/admin/reports/${reportId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload || {}),
  });
}

export async function adminGetPricingRules() {
  return apiFetch('/admin/pricing');
}

export async function adminUpdatePricingRule(payload) {
  return apiFetch('/admin/pricing', {
    method: 'POST',
    body: JSON.stringify(payload || {}),
  });
}

// Aliases for margin specific functions, pointing to the same endpoints
export const adminGetServiceMargins = adminGetPricingRules;
export const adminSetServiceMargin = adminUpdatePricingRule;

export async function adminFundWallet(payload) {
  return apiFetch('/admin/fund-wallet', {
    method: 'POST',
    body: JSON.stringify(payload || {}),
  });
}

export async function adminGetBroadcasts() {
  return apiFetch('/notifications/broadcast/admin');
}

export async function adminCreateBroadcast(payload) {
  return apiFetch('/notifications/broadcast/admin', {
    method: 'POST',
    body: JSON.stringify(payload || {}),
  });
}

export async function adminUpdateBroadcast(id, payload) {
  return apiFetch(`/notifications/broadcast/admin/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload || {}),
  });
}

export async function adminSyncDataPlans() {
  return apiFetch('/data/sync', { method: 'POST' });
}

export async function adminCleanLegacyDataPlans() {
  return apiFetch('/admin/data-plans/clean-legacy', { method: 'POST' });
}

export async function adminAdjustWallet(payload) {
  return apiFetch('/admin/wallets/adjust', {
    method: 'POST',
    body: JSON.stringify(payload || {}),
  });
}

export async function adminGetWallets(params = {}) {
  return apiFetch(`/admin/wallets${toQuery(params)}`);
}

export async function adminReconcileDelivered(payload) {
  return apiFetch('/admin/transactions/reconcile-delivered', {
    method: 'POST',
    body: JSON.stringify(payload || {}),
  });
}

export async function adminReconcileDeliveredBulk(payload) {
  return apiFetch('/admin/transactions/reconcile-delivered-bulk', {
    method: 'POST',
    body: JSON.stringify(payload || {}),
  });
}

export async function adminFailAndRefundPending(payload) {
  return apiFetch('/admin/transactions/fail-and-refund', {
    method: 'POST',
    body: JSON.stringify(payload || {}),
  });
}

export async function adminFailAndRefundPendingBulk(payload) {
  return apiFetch('/admin/transactions/fail-and-refund-bulk', {
    method: 'POST',
    body: JSON.stringify(payload || {}),
  });
}

export async function adminGetServiceToggles() {
  return apiFetch('/admin/services/toggles');
}

export async function adminUpdateServiceToggle(serviceName, payload) {
  return apiFetch(`/admin/services/toggles/${encodeURIComponent(serviceName)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload || {}),
  });
}

export async function adminGetDataPlans() {
  return apiFetch('/admin/data-plans');
}

export async function adminUpdateDataPlan(planId, payload) {
  return apiFetch(`/admin/data-plans/${encodeURIComponent(planId)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload || {}),
  });
}

export async function adminCreateDataPlan(payload) {
  return apiFetch('/admin/data-plans', {
    method: 'POST',
    body: JSON.stringify(payload || {}),
  });
}

export async function adminDeleteDataPlan(planId) {
  return apiFetch(`/admin/data-plans/${encodeURIComponent(planId)}`, {
    method: 'DELETE',
  });
}

export async function adminGetReferrals(params = {}) {
  return apiFetch(`/admin/referrals${toQuery(params)}`);
}

export async function adminGetAuditLogs(params = {}) {
  return apiFetch(`/admin/audit-logs${toQuery(params)}`);
}

export async function adminUpgradeDeveloper(userId) {
  return apiFetch(`/admin/users/${userId}/upgrade-developer`, { method: 'POST' });
}

export async function adminSetPricingOverride(userId, payload) {
  return apiFetch(`/admin/users/${userId}/pricing-overrides`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function adminGetPricingOverrides(userId) {
  return apiFetch(`/admin/users/${userId}/pricing-overrides`, { method: 'GET' });
}

export async function adminSendPushOnly(payload) {
  return apiFetch('/notifications/broadcast/admin/push-only', {
    method: 'POST',
    body: JSON.stringify(payload || {}),
  });
}

export async function adminUploadBroadcastImage(file) {
  const formData = new FormData();
  formData.append('image', file);
  return apiFetch('/notifications/broadcast/admin/upload-image', {
    method: 'POST',
    body: formData,
    timeoutMs: 120000,
  });
}


// Added for Enhanced Admin Pages
export async function adminGetProviderBalances() {
  return apiFetch('/admin/provider-balances');
}

export async function adminGetFinanceOverview() {
  return apiFetch('/admin/finance/overview');
}

export async function adminGetFinanceLedger(params = {}) {
  return apiFetch(`/admin/finance/ledger${toQuery(params)}`);
}

export async function adminCreateFinanceLedgerEntry(payload) {
  return apiFetch('/admin/finance/ledger', {
    method: 'POST',
    body: JSON.stringify(payload || {}),
  });
}

export async function adminGetAmbassadors(params = {}) {
  return apiFetch(`/admin/ambassadors${toQuery(params)}`);
}

export async function adminPayAmbassadorCommission(payload) {
  return apiFetch('/admin/ambassadors/pay-commission', {
    method: 'POST',
    body: JSON.stringify(payload || {}),
  });
}

export async function adminGetAgents(params = {}) {
  return apiFetch(`/admin/agents${toQuery(params)}`);
}

export async function adminCreatePromo(payload) {
  return apiFetch('/promos/admin/create', {
    method: 'POST',
    body: JSON.stringify(payload || {}),
  });
}

export async function adminUpdateReferralCode(payload) {
  return apiFetch('/admin/users/referral-code', {
    method: 'POST',
    body: JSON.stringify(payload || {}),
  });
}
