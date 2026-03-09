import { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
}

export function Button({ variant = 'primary', className, children, ...props }: Props) {
  return (
    <button
      className={cn(
        'rounded-xl font-serif tracking-wide transition-opacity disabled:opacity-50 cursor-pointer',
        variant === 'primary' && 'bg-gradient-to-r from-violet-700 to-purple-500 text-white px-8 py-4 text-lg hover:opacity-85',
        variant === 'secondary' && 'border border-violet-400 text-violet-300 px-4 py-2.5 text-sm hover:bg-violet-950',
        variant === 'ghost' && 'text-violet-400 px-4 py-2 text-sm hover:text-violet-200',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
