function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

export function normalizeTransactionStatus(rawStatus) {
  const status = String(rawStatus || '').trim().toLowerCase();
  if (!status) return 'pending';
  if (status === 'success' || status === 'completed') return 'success';
  if (status === 'failed' || status === 'error' || status === 'declined') return 'failed';
  if (status === 'refunded') return 'refunded';
  return 'pending';
}

export function sanitizeProviderMessage(message) {
  const text = String(message || '').trim();
  if (!text) return '';
  return text
    .replace(/\s*If this persists,\s*set\s+AMIGO_TEST_MODE\s*=\s*true\s*temporarily\.?/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export async function fetchTransactionByReference(apiFetch, reference) {
  const ref = String(reference || '').trim();
  if (!ref || ref === '—' || ref.toUpperCase() === 'N/A') return null;
  const rows = await apiFetch('/transactions/me');
  return safeArray(rows).find((tx) => String(tx?.reference || '').trim() === ref) || null;
}

export async function waitForTransactionFinalStatus(apiFetch, reference, options = {}) {
  const timeoutMs = Number.isFinite(options.timeoutMs) ? options.timeoutMs : 90000;
  const intervalMs = Number.isFinite(options.intervalMs) ? options.intervalMs : 2500;
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    try {
      const tx = await fetchTransactionByReference(apiFetch, reference);
      if (tx) {
        const normalized = normalizeTransactionStatus(tx.status);
        if (normalized !== 'pending') {
          return { final: true, status: normalized, transaction: tx };
        }
      }
    } catch {
      // Swallow poll errors and retry until timeout.
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  return { final: false, status: 'pending', transaction: null };
}
