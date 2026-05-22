'use client';

import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { MobileNav } from './MobileNav';
import { listAssignments, type Assignment } from '@/lib/api';

interface Props {
  title: string;
  back?: boolean;
  children: React.ReactNode;
  /** Hide the bottom mobile nav (e.g., on output paper) */
  hideMobileNav?: boolean;
}

export function AppShell({ title, back = true, children, hideMobileNav }: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    listAssignments()
      .then((rows: Assignment[]) => setCount(rows.length))
      .catch(() => setCount(0));
  }, []);

  return (
    <div className="min-h-screen lg:flex bg-ink-50">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex w-[260px] shrink-0 border-r border-ink-100">
        <div className="w-full">
          <Sidebar assignmentsCount={count} />
        </div>
      </div>

      {/* Mobile drawer */}
      <div
        className={clsx(
          'lg:hidden fixed inset-0 z-40 transition',
          drawerOpen ? 'pointer-events-auto' : 'pointer-events-none'
        )}
      >
        <div
          className={clsx(
            'absolute inset-0 bg-black/40 transition-opacity',
            drawerOpen ? 'opacity-100' : 'opacity-0'
          )}
          onClick={() => setDrawerOpen(false)}
        />
        <div
          className={clsx(
            'absolute left-0 top-0 bottom-0 w-[260px] bg-white shadow-xl transition-transform',
            drawerOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <Sidebar assignmentsCount={count} onNavigate={() => setDrawerOpen(false)} />
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          title={title}
          back={back}
          onMenuClick={() => setDrawerOpen(true)}
        />
        <main className={clsx('flex-1', !hideMobileNav && 'pb-24 lg:pb-0')}>
          {children}
        </main>
        {!hideMobileNav && <MobileNav />}
      </div>
    </div>
  );
}
