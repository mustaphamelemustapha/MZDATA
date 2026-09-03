import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function AdminMetricCard({ label, value, detail, icon: Icon, tone = 'brand' }) {
  const iconTone =
    tone === 'success'
      ? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-400/30 dark:bg-emerald-500/12 dark:text-emerald-200'
      : tone === 'warning'
        ? 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-400/30 dark:bg-amber-500/12 dark:text-amber-200'
        : tone === 'danger'
          ? 'border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-400/30 dark:bg-rose-500/12 dark:text-rose-200'
          : 'border-orange-300 bg-orange-50 text-primary dark:border-orange-400/30 dark:bg-orange-500/12 dark:text-orange-200';

  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-3 p-5">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">{label}</div>
          <div className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{value}</div>
          {detail ? <div className="mt-1 text-sm text-muted-foreground">{detail}</div> : null}
        </div>
        {Icon ? (
          <div className={cn('flex h-11 w-11 items-center justify-center rounded-2xl border', iconTone)}>
            <Icon className="h-5 w-5" />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
