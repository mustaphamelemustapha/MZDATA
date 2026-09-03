import { cn } from '@/lib/utils';

function Badge({ className, tone = 'neutral', ...props }) {
  const toneClass =
    tone === 'success'
      ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800'
      : tone === 'warning'
      ? 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800'
      : tone === 'danger'
      ? 'bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-400 dark:border-rose-800'
      : 'bg-secondary text-secondary-foreground border-border';
  return <span className={cn('inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium', toneClass, className)} {...props} />;
}

export { Badge };
