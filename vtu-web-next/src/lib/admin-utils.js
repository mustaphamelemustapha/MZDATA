import { formatDateTime } from '@/lib/format';

export function safeList(value) {
  return Array.isArray(value) ? value : [];
}

export function asMoney(value) {
  const number = Number(value || 0);
  if (!Number.isFinite(number)) return 0;
  return number;
}

export function startCase(value) {
  return String(value || '—')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function readableDate(value) {
  return formatDateTime(value);
}

export function percent(value) {
  const n = Number(value || 0);
  if (!Number.isFinite(n)) return '0%';
  return `${n.toFixed(2)}%`;
}
