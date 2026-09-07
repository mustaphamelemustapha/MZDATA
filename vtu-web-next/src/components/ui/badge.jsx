import { cn } from '@/lib/utils';

function Badge({ className, tone = 'neutral', ...props }) {
  const toneClass =
    tone === 'success'
      ? 'bg-gradient-to-br from-emerald-100 to-emerald-50 text-emerald-700 border-emerald-300/50 shadow-sm shadow-emerald-200/50 dark:from-emerald-500/20 dark:to-emerald-500/5 dark:text-emerald-300 dark:border-emerald-500/30'
      : tone === 'warning'
      ? 'bg-gradient-to-br from-amber-100 to-amber-50 text-amber-700 border-amber-300/50 shadow-sm shadow-amber-200/50 dark:from-amber-500/20 dark:to-amber-500/5 dark:text-amber-300 dark:border-amber-500/30'
      : tone === 'danger'
      ? 'bg-gradient-to-br from-rose-100 to-rose-50 text-rose-700 border-rose-300/50 shadow-sm shadow-rose-200/50 dark:from-rose-500/20 dark:to-rose-500/5 dark:text-rose-300 dark:border-rose-500/30'
      : 'bg-gradient-to-br from-secondary/80 to-secondary/40 text-secondary-foreground border-border/50 shadow-sm';
  return <span className={cn('inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider backdrop-blur-md', toneClass, className)} {...props} />;
}

export { Badge };
