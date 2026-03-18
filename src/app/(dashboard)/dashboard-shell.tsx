'use client';

import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import AiChat from '@/components/AiChat';
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils';

interface DashboardShellProps {
  children: React.ReactNode;
  poles?: { id: string; nom: string; icone: string }[];
}

export function DashboardShell({ children, poles = [] }: DashboardShellProps) {
  const sidebarCollapsed = useAppStore((s) => s.sidebarCollapsed);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar poles={poles} />
      <div
        className={cn(
          'flex-1 flex flex-col overflow-hidden transition-all duration-300',
          // On mobile, sidebar is overlay so no margin needed
        )}
      >
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
      <AiChat />
    </div>
  );
}
