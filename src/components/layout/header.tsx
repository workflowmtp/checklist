'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useAppStore } from '@/lib/store';
import type { BreadcrumbItem } from '@/types';

interface HeaderProps {
  breadcrumbs?: BreadcrumbItem[];
}

const DAYS_FR = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

export function Header({ breadcrumbs = [] }: HeaderProps) {
  const router = useRouter();
  const { toggleSidebar, toggleMobileSidebar, theme, toggleTheme } = useAppStore();
  const [clock, setClock] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const day = DAYS_FR[now.getDay()];
      const d = now.getDate();
      const m = now.getMonth() + 1;
      const h = now.getHours().toString().padStart(2, '0');
      const min = now.getMinutes().toString().padStart(2, '0');
      setClock(`${day} ${d}/${m} ${h}:${min}`);
    };
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleMenuClick = () => {
    if (typeof window !== 'undefined' && window.innerWidth <= 1024) {
      toggleMobileSidebar();
    } else {
      toggleSidebar();
    }
  };

  return (
    <header className="h-[60px] bg-[var(--bg-header)] border-b border-[var(--border-primary)] backdrop-blur-[12px] flex items-center justify-between px-6 flex-shrink-0">
      {/* Left */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleMenuClick}
          className="w-9 h-9 rounded-md flex items-center justify-center text-[var(--text-secondary)] border border-transparent hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] hover:border-[var(--border-primary)] transition-all"
          title="Menu"
        >
          ☰
        </button>
        <nav className="flex items-center gap-2 text-[0.85rem] text-[var(--text-secondary)]">
          {breadcrumbs.map((item, i) => (
            <span key={i} className="flex items-center gap-2">
              {i > 0 && <span className="text-[var(--text-tertiary)]">›</span>}
              {i === breadcrumbs.length - 1 ? (
                <span className="text-[var(--text-primary)] font-semibold">
                  {item.label}
                </span>
              ) : item.href ? (
                <span
                  className="cursor-pointer hover:text-[var(--accent-blue)] transition-colors"
                  onClick={() => router.push(item.href!)}
                >
                  {item.label}
                </span>
              ) : (
                <span>{item.label}</span>
              )}
            </span>
          ))}
        </nav>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* Clock */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--bg-tertiary)] rounded-md text-[0.8rem] text-[var(--text-secondary)]">
          <span className="w-2 h-2 rounded-full bg-[var(--accent-green)]" />
          <span>{clock}</span>
        </div>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="w-9 h-9 rounded-md flex items-center justify-center text-[var(--text-secondary)] border border-transparent hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] hover:border-[var(--border-primary)] transition-all"
          title="Thème"
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>

        {/* Notifications */}
        <button
          onClick={() => router.push('/notifications')}
          className="w-9 h-9 rounded-md flex items-center justify-center text-[var(--text-secondary)] border border-transparent hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] hover:border-[var(--border-primary)] transition-all"
          title="Notifications"
        >
          🔔
        </button>

        {/* Logout */}
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-9 h-9 rounded-md flex items-center justify-center text-[var(--text-secondary)] border border-transparent hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] hover:border-[var(--border-primary)] transition-all"
          title="Déconnexion"
        >
          ⏻
        </button>
      </div>
    </header>
  );
}
