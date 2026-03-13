'use client';

import { cn } from '@/lib/utils';
import { forwardRef } from 'react';

/* FormField wrapper */
export function FormField({ label, required, children, className }: {
  label: string; required?: boolean; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={cn('mb-4', className)}>
      <label className="block text-[0.8rem] font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">
        {label}{required && ' *'}
      </label>
      {children}
    </div>
  );
}

/* FormInput */
export const FormInput = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { error?: string }>(
  ({ className, error, ...props }, ref) => (
    <div>
      <input ref={ref} className={cn(
        'w-full px-3.5 py-3 bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-md text-[var(--text-primary)] text-[0.95rem] focus-ring transition-all placeholder:text-[var(--text-tertiary)]',
        error && 'border-[var(--accent-red)]', className
      )} {...props} />
      {error && <p className="text-[var(--accent-red)] text-[0.75rem] mt-1">{error}</p>}
    </div>
  )
);
FormInput.displayName = 'FormInput';

/* FormSelect */
export const FormSelect = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select ref={ref} className={cn(
      'w-full px-3 py-3 bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-md text-[var(--text-primary)] text-[0.95rem] focus-ring cursor-pointer', className
    )} {...props}>{children}</select>
  )
);
FormSelect.displayName = 'FormSelect';

/* FormTextarea */
export const FormTextarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea ref={ref} className={cn(
      'w-full px-3.5 py-3 bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-md text-[var(--text-primary)] text-[0.95rem] focus-ring resize-y transition-all placeholder:text-[var(--text-tertiary)]', className
    )} {...props} />
  )
);
FormTextarea.displayName = 'FormTextarea';

/* FormRow */
export function FormRow({ cols = 2, children }: { cols?: 2 | 3; children: React.ReactNode }) {
  return <div className={cn('grid gap-3.5', cols === 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2')}>{children}</div>;
}
