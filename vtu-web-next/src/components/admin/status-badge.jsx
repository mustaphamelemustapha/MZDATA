import { Badge } from '@/components/ui/badge';
import { statusTones } from '@/lib/admin-nav';

function toneForStatus(status) {
  const key = String(status || '').trim().toLowerCase().replace(/\s+/g, '_');
  return statusTones[key] || 'neutral';
}

export function StatusBadge({ status }) {
  const text = String(status || 'unknown').replace(/_/g, ' ');
  return <Badge tone={toneForStatus(status)}>{text}</Badge>;
}
