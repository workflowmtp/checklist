'use client';

import { cn } from '@/lib/utils';

type Variant = 'active' | 'paused' | 'closed' | 'stopped';

const variantStyles: Record<Variant, string> = {
  active: 'bg-[var(--accent-green-dim)] text-[var(--accent-green)]',
  paused: 'bg-[var(--accent-orange-dim)] text-[var(--accent-orange)]',
  closed: 'bg-[var(--accent-blue-dim)] text-[var(--accent-blue)]',
  stopped: 'bg-[var(--accent-red-dim)] text-[var(--accent-red)]',
};

interface StatusBadgeProps {
  variant: Variant;
  children: React.ReactNode;
  className?: string;
}

export function StatusBadge({ variant, children, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[0.72rem] font-semibold uppercase tracking-wide',
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
