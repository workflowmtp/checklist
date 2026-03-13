'use client';

import { SessionProvider } from 'next-auth/react';
import { useEffect } from 'react';
import { useAppStore } from '@/lib/store';

export function Providers({ children }: { children: React.ReactNode }) {
  const theme = useAppStore((s) => s.theme);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return <SessionProvider>{children}</SessionProvider>;
}
