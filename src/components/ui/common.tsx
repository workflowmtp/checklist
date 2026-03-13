'use client';

import { cn } from '@/lib/utils';
import { useState, useCallback, useEffect, useRef } from 'react';

/* ============================================================
   AlertBanner
   ============================================================ */
type AlertVariant = 'info' | 'warning' | 'danger' | 'success';
const alertStyles: Record<AlertVariant, string> = {
  info: 'bg-[var(--accent-blue-dim)] border-[rgba(59,130,246,0.2)] text-[var(--accent-blue)]',
  warning: 'bg-[var(--accent-orange-dim)] border-[rgba(245,158,11,0.2)] text-[var(--accent-orange)]',
  danger: 'bg-[var(--accent-red-dim)] border-[rgba(239,68,68,0.2)] text-[var(--accent-red)]',
  success: 'bg-[var(--accent-green-dim)] border-[rgba(34,197,94,0.2)] text-[var(--accent-green)]',
};

export function AlertBanner({ variant, icon, children, className }: { variant: AlertVariant; icon?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-center gap-3 px-4 py-3 rounded-md border text-[0.85rem]', alertStyles[variant], className)}>
      {icon && <span>{icon}</span>}
      <span className="flex-1">{children}</span>
    </div>
  );
}

/* ============================================================
   SectionBlock
   ============================================================ */
export function SectionBlock({ title, icon, badge, extra, children, className }: {
  title?: string; icon?: string; badge?: string | number; extra?: React.ReactNode;
  children: React.ReactNode; className?: string;
}) {
  return (
    <div className={cn('bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-lg p-5 mb-5', className)}>
      {title && (
        <div className="font-mono font-bold text-base mb-3.5 flex items-center gap-2.5">
          {icon && <span>{icon}</span>}
          <span>{title}</span>
          {badge != null && (
            <span className="font-mono text-[0.7rem] font-semibold px-2 py-0.5 bg-[var(--bg-tertiary)] rounded-full text-[var(--text-tertiary)]">{badge}</span>
          )}
          {extra && <span className="ml-auto">{extra}</span>}
        </div>
      )}
      {children}
    </div>
  );
}

/* ============================================================
   Modal
   ============================================================ */
export function Modal({ open, onClose, title, wide, children }: {
  open: boolean; onClose: () => void; title?: string; wide?: boolean; children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-[4px] z-[1000] flex items-center justify-center p-4" onClick={onClose}>
      <div
        className={cn('bg-[var(--bg-modal)] border border-[var(--border-primary)] rounded-xl w-full max-h-[85vh] overflow-y-auto p-7 shadow-lg', wide ? 'max-w-[650px]' : 'max-w-[500px]')}
        onClick={(e) => e.stopPropagation()}
      >
        {title && <h2 className="font-mono font-bold text-[1.15rem] mb-5">{title}</h2>}
        {children}
      </div>
    </div>
  );
}

export function ModalActions({ children }: { children: React.ReactNode }) {
  return <div className="flex justify-end gap-2.5 mt-6">{children}</div>;
}

/* ============================================================
   EmptyState
   ============================================================ */
export function EmptyState({ icon, text, children }: { icon?: string; text: string; children?: React.ReactNode }) {
  return (
    <div className="text-center py-12 px-6 text-[var(--text-tertiary)]">
      {icon && <div className="text-[2.5rem] mb-3">{icon}</div>}
      <div className="text-[0.9rem]">{text}</div>
      {children}
    </div>
  );
}

/* ============================================================
   ProgressBar
   ============================================================ */
export function ProgressBar({ value, max, label, className }: { value: number; max: number; label?: string; className?: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className={className}>
      {label && (
        <div className="flex justify-between text-[0.8rem] text-[var(--text-secondary)] mb-1">
          <span>{label}</span>
          <span className="font-mono font-bold">{pct}%</span>
        </div>
      )}
      <div className="h-2 bg-[var(--bg-tertiary)] rounded overflow-hidden">
        <div className="h-full rounded transition-all duration-500" style={{ width: `${pct}%`, background: 'linear-gradient(90deg,var(--accent-blue),var(--accent-green))' }} />
      </div>
    </div>
  );
}

/* ============================================================
   Chip
   ============================================================ */
export function Chip({ children, onRemove, className }: { children: React.ReactNode; onRemove?: () => void; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 px-2.5 py-0.5 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-full text-[0.75rem] text-[var(--text-secondary)]', className)}>
      {children}
      {onRemove && <button onClick={onRemove} className="text-[var(--accent-red)] font-bold ml-0.5 hover:opacity-70">×</button>}
    </span>
  );
}

/* ============================================================
   PageTitle
   ============================================================ */
export function PageTitle({ title, subtitle, icon, extra }: { title: string; subtitle?: string; icon?: string; extra?: React.ReactNode }) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        <h1 className="font-mono text-[1.5rem] font-bold mb-1">
          {icon && <span className="mr-2">{icon}</span>}{title}
        </h1>
        {subtitle && <p className="text-[var(--text-secondary)] text-[0.9rem]">{subtitle}</p>}
      </div>
      {extra && <div className="flex-shrink-0">{extra}</div>}
    </div>
  );
}
