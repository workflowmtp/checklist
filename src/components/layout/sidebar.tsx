'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useAppStore } from '@/lib/store';
import { cn, getInitials } from '@/lib/utils';
import { getRoleLabel } from '@/lib/permissions';

interface NavSection {
  title: string;
  items: NavLink[];
}

interface NavLink {
  href: string;
  icon: string;
  label: string;
  matchPrefix?: string;
}

const mainNav: NavSection[] = [
  {
    title: 'Principal',
    items: [
      { href: '/', icon: '🏠', label: 'Accueil' },
      { href: '/dashboard', icon: '📊', label: 'Dashboard KPI', matchPrefix: '/dashboard' },
    ],
  },
  {
    title: 'Production',
    items: [
      { href: '/configuration-taches', icon: '🔧', label: 'Config. Tâches', matchPrefix: '/configuration-taches' },
      { href: '/historique', icon: '📜', label: 'Historique', matchPrefix: '/historique' },
      { href: '/exports', icon: '📤', label: 'Exports', matchPrefix: '/exports' },
    ],
  },
  {
    title: 'Intelligence',
    items: [
      { href: '/ai', icon: '🤖', label: 'PrintSeq AI', matchPrefix: '/ai' },
    ],
  },
  {
    title: 'Système',
    items: [
      { href: '/admin', icon: '⚙️', label: 'Administration', matchPrefix: '/admin' },
      { href: '/erp', icon: '🔗', label: 'Intégration ERP', matchPrefix: '/erp' },
    ],
  },
];

interface SidebarProps {
  poles?: { id: string; nom: string; icone: string }[];
}

export function Sidebar({ poles = [] }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { sidebarCollapsed, sidebarMobileOpen, closeMobileSidebar } = useAppStore();
  const user = session?.user;

  const isActive = (item: NavLink) => {
    if (item.href === '/') return pathname === '/';
    if (item.matchPrefix) return pathname.startsWith(item.matchPrefix);
    return pathname === item.href;
  };

  return (
    <>
      {/* Mobile overlay */}
      {sidebarMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[199] lg:hidden"
          onClick={closeMobileSidebar}
        />
      )}

      <aside
        className={cn(
          'h-screen bg-[var(--bg-sidebar)] border-r border-[var(--border-primary)]',
          'flex flex-col flex-shrink-0 z-[200] transition-all duration-300',
          // Desktop
          'max-lg:fixed max-lg:left-0 max-lg:top-0',
          sidebarCollapsed ? 'w-[68px]' : 'w-[260px]',
          // Mobile
          sidebarMobileOpen ? 'max-lg:translate-x-0' : 'max-lg:-translate-x-full',
        )}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 min-h-[60px] border-b border-[var(--border-primary)]">
          <div className="w-9 h-9 rounded-md flex items-center justify-center text-white text-base flex-shrink-0 btn-gradient-purple">
            ⚙
          </div>
          {!sidebarCollapsed && (
            <span className="font-mono font-bold text-[1.15rem] whitespace-nowrap overflow-hidden">
              PrintSeq
            </span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          {mainNav.map((section) => (
            <div key={section.title}>
              {!sidebarCollapsed && (
                <div className="text-[0.65rem] font-bold uppercase tracking-[1px] text-[var(--text-tertiary)] px-3 pt-4 pb-1.5 whitespace-nowrap">
                  {section.title}
                </div>
              )}
              {section.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMobileSidebar}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-md text-[0.9rem] mb-0.5',
                    'transition-all duration-200 whitespace-nowrap',
                    isActive(item)
                      ? 'bg-[var(--accent-blue-dim)] text-[var(--accent-blue)] font-semibold'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]',
                  )}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <span className="w-5 text-center flex-shrink-0 text-base">
                    {item.icon}
                  </span>
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </Link>
              ))}
            </div>
          ))}

          {/* Dynamic Poles */}
          {poles.length > 0 && (
            <div>
              {!sidebarCollapsed && (
                <div className="text-[0.65rem] font-bold uppercase tracking-[1px] text-[var(--text-tertiary)] px-3 pt-4 pb-1.5 whitespace-nowrap">
                  Pôles
                </div>
              )}
              {poles.map((pole) => (
                <Link
                  key={pole.id}
                  href={`/pole/${pole.id}`}
                  onClick={closeMobileSidebar}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-md text-[0.9rem] mb-0.5',
                    'transition-all duration-200 whitespace-nowrap',
                    pathname === `/pole/${pole.id}`
                      ? 'bg-[var(--accent-blue-dim)] text-[var(--accent-blue)] font-semibold'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]',
                  )}
                  title={sidebarCollapsed ? pole.nom : undefined}
                >
                  <span className="w-5 text-center flex-shrink-0 text-base">{pole.icone}</span>
                  {!sidebarCollapsed && <span>{pole.nom}</span>}
                </Link>
              ))}
            </div>
          )}
        </nav>

        {/* Footer: User info */}
        <div className="px-4 py-3 border-t border-[var(--border-primary)]">
          {user && !sidebarCollapsed && (
            <div
              className="flex items-center gap-2.5 p-2 rounded-md cursor-pointer transition-colors hover:bg-[var(--bg-tertiary)]"
              onClick={() => signOut({ callbackUrl: '/login' })}
              title="Se déconnecter"
            >
              <div className="w-8 h-8 rounded-full bg-[var(--accent-blue-dim)] text-[var(--accent-blue)] flex items-center justify-center font-bold text-[0.8rem] flex-shrink-0">
                {getInitials(user.name || '')}
              </div>
              <div className="min-w-0">
                <div className="text-[0.85rem] font-semibold leading-tight truncate">
                  {user.name}
                </div>
                <div className="text-[0.7rem] text-[var(--text-tertiary)] truncate">
                  {getRoleLabel(user.role)}
                </div>
              </div>
            </div>
          )}
          {user && sidebarCollapsed && (
            <div
              className="flex justify-center cursor-pointer"
              onClick={() => signOut({ callbackUrl: '/login' })}
              title={`${user.name} — Se déconnecter`}
            >
              <div className="w-8 h-8 rounded-full bg-[var(--accent-blue-dim)] text-[var(--accent-blue)] flex items-center justify-center font-bold text-[0.8rem]">
                {getInitials(user.name || '')}
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
