import { cn } from '@/lib/utils';

function Separator({ className, orientation = 'horizontal', ...props }) {
  return (
    <div
      className={cn(
        orientation === 'vertical' ? 'h-full w-px' : 'h-px w-full',
        'bg-border',
        className
      )}
      {...props}
    />
  );
}

export { Separator };
