'use client';

import { cn } from '@/lib/utils';

interface KpiCardProps {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
  borderColor?: string;
  className?: string;
}

export function KpiCard({ label, value, sub, color, borderColor, className }: KpiCardProps) {
  return (
    <div
      className={cn('bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-md p-4 relative overflow-hidden', className)}
      style={borderColor ? { borderBottomWidth: '3px', borderBottomColor: borderColor } : undefined}
    >
      <div className="text-[0.72rem] text-[var(--text-tertiary)] uppercase tracking-wider mb-1.5">{label}</div>
      <div className="font-mono text-[1.6rem] font-bold leading-tight" style={color ? { color } : undefined}>
        {value}
      </div>
      {sub && <div className="text-[0.75rem] text-[var(--text-tertiary)] mt-1">{sub}</div>}
    </div>
  );
}
