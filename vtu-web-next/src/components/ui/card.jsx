import { cn } from '@/lib/utils';

function Card({ className, ...props }) {
  return <div className={cn('rounded-3xl border border-border bg-card text-card-foreground shadow-[0_10px_30px_rgba(15,23,42,0.06)] dark:shadow-[0_18px_48px_rgba(0,0,0,0.28)]', className)} {...props} />;
}

function CardHeader({ className, ...props }) {
  return <div className={cn('p-6 pb-0', className)} {...props} />;
}

function CardContent({ className, ...props }) {
  return <div className={cn('p-6', className)} {...props} />;
}

function CardTitle({ className, ...props }) {
  return <h3 className={cn('text-base font-semibold tracking-tight text-card-foreground', className)} {...props} />;
}

function CardDescription({ className, ...props }) {
  return <p className={cn('text-sm leading-6 text-muted-foreground', className)} {...props} />;
}

export { Card, CardHeader, CardContent, CardTitle, CardDescription };
