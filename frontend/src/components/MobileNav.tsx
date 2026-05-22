'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import clsx from 'clsx';
import { LayoutGrid, ClipboardList, BookOpen, Sparkles, Plus } from 'lucide-react';

const items = [
  { label: 'Home', href: '/', icon: LayoutGrid, match: (p: string) => p === '/' },
  {
    label: 'Assignments',
    href: '/assignments',
    icon: ClipboardList,
    match: (p: string) =>
      p === '/assignments' ||
      p.startsWith('/assignment') ||
      p.startsWith('/generating'),
  },
  { label: 'Library', href: '/library', icon: BookOpen, match: (p: string) => p === '/library' },
  { label: 'AI Toolkit', href: '/toolkit', icon: Sparkles, match: (p: string) => p === '/toolkit' },
];

export function MobileNav() {
  const pathname = usePathname() || '/';
  const router = useRouter();

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-ink-900 text-white">
      <div className="relative max-w-md mx-auto px-4 py-3 grid grid-cols-4 gap-1">
        {items.map((it) => {
          const active = it.match(pathname);
          return (
            <Link
              key={it.href}
              href={it.href}
              className={clsx(
                'flex flex-col items-center gap-0.5 text-[11px] py-1.5 rounded-lg transition',
                active ? 'text-white' : 'text-white/60'
              )}
            >
              <it.icon className="w-5 h-5" />
              <span>{it.label}</span>
              {active && <span className="absolute -top-px left-0 right-0 mx-auto w-8 h-0.5 rounded-full bg-white" />}
            </Link>
          );
        })}

        {/* Floating + */}
        <button
          onClick={() => router.push('/create')}
          className="absolute -top-5 right-5 w-11 h-11 rounded-full bg-brand-500 hover:bg-brand-600 text-white shadow-lg grid place-items-center"
          aria-label="Create assignment"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
    </nav>
  );
}
