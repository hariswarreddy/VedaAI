'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, CheckCircle2, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { listAssignments, type Assignment } from '@/lib/api';

function fmtRelative(iso: string) {
  const t = new Date(iso).getTime();
  if (isNaN(t)) return '';
  const diff = Date.now() - t;
  const s = Math.floor(diff / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export function NotificationsButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Assignment[] | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const rows = await listAssignments();
        setItems(rows);
      } catch {
        setItems([]);
      }
    }
    load();
    const i = setInterval(load, 15000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const recent = (items || []).slice(0, 8);
  const unread = (items || []).filter((a) => a.status !== 'completed').length;

  function navigate(a: Assignment) {
    setOpen(false);
    if (a.status === 'completed') router.push(`/assignment/${a._id}`);
    else router.push(`/generating/${a._id}`);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-full hover:bg-ink-50 text-ink-700"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-brand-500 text-white text-[10px] font-bold grid place-items-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[320px] max-w-[calc(100vw-1.5rem)] bg-white rounded-xl shadow-xl border border-ink-100 z-30 overflow-hidden">
          <div className="px-4 py-3 border-b border-ink-100 flex items-center justify-between">
            <div className="font-semibold text-ink-900 text-sm">Notifications</div>
            <span className="text-[11px] text-ink-500">{recent.length} recent</span>
          </div>

          <div className="max-h-[360px] overflow-y-auto">
            {items === null ? (
              <div className="py-10 grid place-items-center">
                <Loader2 className="w-5 h-5 animate-spin text-ink-300" />
              </div>
            ) : recent.length === 0 ? (
              <div className="py-10 text-center text-sm text-ink-500 px-4">
                You&rsquo;ll see new assignments here as you create them.
              </div>
            ) : (
              <ul>
                {recent.map((a) => (
                  <li key={a._id}>
                    <button
                      onClick={() => navigate(a)}
                      className="w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-ink-50 transition"
                    >
                      <StatusIcon status={a.status} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-ink-900 truncate">
                          {a.title || 'Untitled assignment'}
                        </div>
                        <div className="text-xs text-ink-500 mt-0.5 flex items-center gap-2">
                          <span className="capitalize">{a.status}</span>
                          <span>·</span>
                          <span>{fmtRelative(a.createdAt)}</span>
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button
            onClick={() => {
              setOpen(false);
              router.push('/');
            }}
            className="w-full text-center text-xs font-medium text-brand-600 hover:bg-ink-50 py-2.5 border-t border-ink-100"
          >
            View all assignments
          </button>
        </div>
      )}
    </div>
  );
}

function StatusIcon({ status }: { status: Assignment['status'] }) {
  if (status === 'completed')
    return <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />;
  if (status === 'failed')
    return <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />;
  return <Clock className="w-4 h-4 text-amber-500 mt-0.5 shrink-0 animate-pulse" />;
}
