import { cn } from '@/lib/utils';

export function AdminMetricCard({ label, value, detail, icon: Icon, tone = 'brand' }) {
  const iconTone =
    tone === 'success'
      ? 'border-emerald-300/50 bg-gradient-to-br from-emerald-100 to-emerald-50 text-emerald-700 shadow-emerald-200/50 dark:border-emerald-500/30 dark:from-emerald-500/20 dark:to-emerald-500/5 dark:text-emerald-300 dark:shadow-emerald-900/50'
      : tone === 'warning'
        ? 'border-amber-300/50 bg-gradient-to-br from-amber-100 to-amber-50 text-amber-700 shadow-amber-200/50 dark:border-amber-500/30 dark:from-amber-500/20 dark:to-amber-500/5 dark:text-amber-300 dark:shadow-amber-900/50'
        : tone === 'danger'
          ? 'border-rose-300/50 bg-gradient-to-br from-rose-100 to-rose-50 text-rose-700 shadow-rose-200/50 dark:border-rose-500/30 dark:from-rose-500/20 dark:to-rose-500/5 dark:text-rose-300 dark:shadow-rose-900/50'
          : 'border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5 text-primary shadow-primary/20 dark:border-primary/20 dark:from-primary/20 dark:to-primary/5 dark:text-primary dark:shadow-primary/10';

  return (
    <div className="group relative overflow-hidden rounded-3xl border border-border/50 bg-card/60 p-5 shadow-sm backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-border">
      <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-primary/5 blur-3xl transition-opacity duration-300 group-hover:bg-primary/10" />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground transition-colors group-hover:text-primary/70">{label}</div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-foreground md:text-3xl">{value}</div>
          {detail ? <div className="mt-1.5 text-[13px] font-medium text-muted-foreground/80">{detail}</div> : null}
        </div>
        {Icon ? (
          <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3', iconTone)}>
            <Icon className="h-5 w-5" />
          </div>
        ) : null}
      </div>
    </div>
  );
}
