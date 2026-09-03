import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function MetricCard({ label, value, detail, icon: Icon, tone = 'brand', className }) {
  const toneClass =
    tone === 'emerald'
      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
      : tone === 'amber'
      ? 'bg-amber-50 text-amber-800 border-amber-300'
      : tone === 'violet'
      ? 'bg-violet-50 text-violet-800 border-violet-300'
      : 'bg-blue-50 text-primary border-blue-300';

  return (
    <Card className={cn('border-border bg-card', className)}>
      <CardContent className="flex items-start justify-between gap-4 p-5">
        <div className="space-y-2">
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">{label}</div>
          <div className="text-2xl font-semibold tracking-tight text-foreground md:text-[1.65rem]">{value}</div>
          {detail ? <div className="text-sm leading-6 text-muted-foreground">{detail}</div> : null}
        </div>
        {Icon ? (
          <div className={cn('flex h-11 w-11 items-center justify-center rounded-2xl border', toneClass)}>
            <Icon className="h-5 w-5" />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
