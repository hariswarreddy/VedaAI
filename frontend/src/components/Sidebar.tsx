'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import clsx from 'clsx';
import {
  LayoutGrid,
  Users,
  ClipboardList,
  BookOpen,
  Clock,
  Settings,
  Sparkles,
} from 'lucide-react';
import { Logo } from './Logo';

interface NavItem {
  label: string;
  href: string;
  icon: any;
  badge?: number;
  match?: (path: string) => boolean;
}

export function Sidebar({
  assignmentsCount = 0,
  onNavigate,
}: {
  assignmentsCount?: number;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const items: NavItem[] = [
    { label: 'Home', href: '/', icon: LayoutGrid, match: (p) => p === '/' },
    { label: 'My Groups', href: '/groups', icon: Users },
    {
      label: 'Assignments',
      href: '/assignments',
      icon: ClipboardList,
      badge: assignmentsCount,
      match: (p) => p === '/assignments' || p.startsWith('/assignment') || p.startsWith('/create') || p.startsWith('/generating'),
    },
    { label: "AI Teacher's Toolkit", href: '/toolkit', icon: BookOpen },
    { label: 'My Library', href: '/library', icon: Clock },
  ];

  return (
    <aside className="h-full flex flex-col bg-white">
      {/* Logo */}
      <div className="px-6 pt-6 pb-4">
        <Logo />
      </div>

      {/* Create Assignment CTA */}
      <div className="px-4 pb-4">
        <button
          onClick={() => {
            onNavigate?.();
            router.push('/create');
          }}
          className="w-full rounded-full bg-ink-900 text-white text-sm font-medium px-4 py-2.5 flex items-center justify-center gap-2 ring-2 ring-brand-500 ring-offset-2 ring-offset-white hover:bg-ink-800 transition"
        >
          <Sparkles className="w-4 h-4 text-brand-300" />
          Create Assignment
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 overflow-y-auto no-scrollbar">
        <ul className="space-y-0.5">
          {items.map((item) => {
            const active = item.match
              ? item.match(pathname || '/')
              : pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  className={clsx(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition',
                    active
                      ? 'bg-ink-100 text-ink-900 font-medium'
                      : 'text-ink-600 hover:bg-ink-50'
                  )}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  {item.badge ? (
                    <span className="text-[11px] font-semibold px-1.5 min-w-[22px] h-[18px] rounded-md bg-brand-500 text-white grid place-items-center">
                      {item.badge}
                    </span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom: settings + school card */}
      <div className="px-3 pb-4 pt-2 space-y-2 border-t border-ink-100/60">
        <Link
          href="/settings"
          onClick={onNavigate}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-ink-600 hover:bg-ink-50"
        >
          <Settings className="w-4 h-4" />
          Settings
        </Link>

        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-ink-50">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 grid place-items-center text-white text-sm font-bold">
            DP
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-ink-900 truncate">
              Delhi Public School
            </div>
            <div className="text-xs text-ink-500 truncate">Bokaro Steel City</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
