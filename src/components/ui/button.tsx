'use client';

import { cn } from '@/lib/utils';
import { forwardRef } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'success' | 'ghost' | 'icon';
type Size = 'sm' | 'md' | 'lg';

const variantClasses: Record<Variant, string> = {
  primary: 'btn-gradient-blue text-white font-semibold',
  secondary: 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-primary)] hover:bg-[var(--bg-card-hover)]',
  danger: 'bg-[var(--accent-red-dim)] text-[var(--accent-red)] border border-[rgba(239,68,68,0.2)] hover:bg-[var(--accent-red)] hover:text-white',
  success: 'btn-gradient-green text-white font-semibold',
  ghost: 'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]',
  icon: 'w-9 h-9 p-0 bg-transparent text-[var(--text-secondary)] border border-transparent hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] hover:border-[var(--border-primary)]',
};

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-[0.8rem]',
  md: 'px-5 py-2.5 text-[0.9rem]',
  lg: 'px-6 py-3.5 text-base',
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  block?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', block, className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-md font-semibold cursor-pointer transition-all duration-200',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          variant !== 'icon' && sizeClasses[size],
          variantClasses[variant],
          block && 'w-full',
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
