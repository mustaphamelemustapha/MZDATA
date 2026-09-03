import { cn } from '@/lib/utils';

function Input({ className, ...props }) {
  return (
    <input
      className={cn(
        'flex h-11 w-full rounded-2xl border border-border bg-input px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-primary/70 focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-secondary disabled:text-muted-foreground',
        className
      )}
      {...props}
    />
  );
}

export { Input };
