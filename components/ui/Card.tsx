import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function Card({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('bg-card border border-border rounded-2xl p-5 text-card-foreground', className)}
      {...props}
    >
      {children}
    </div>
  );
}
