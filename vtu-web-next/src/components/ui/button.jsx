'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-70',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow-sm shadow-blue-500/20 hover:bg-primary/90 disabled:bg-primary/55 disabled:text-primary-foreground',
        secondary: 'border border-border bg-secondary text-secondary-foreground hover:bg-secondary/80 disabled:text-muted-foreground',
        ghost: 'bg-transparent text-foreground hover:bg-secondary disabled:text-muted-foreground',
        outline: 'border border-border bg-card text-card-foreground hover:bg-secondary disabled:text-muted-foreground',
      },
      size: {
        default: 'h-11 px-4 py-2',
        sm: 'h-9 rounded-xl px-3',
        lg: 'h-12 rounded-2xl px-5 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : 'button';
  const buttonProps = Comp === 'button' && props.type == null ? { type: 'button' } : {};
  return <Comp ref={ref} className={cn(buttonVariants({ variant, size, className }))} {...buttonProps} {...props} />;
});
Button.displayName = 'Button';

export { Button, buttonVariants };
