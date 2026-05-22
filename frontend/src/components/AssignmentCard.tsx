'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MoreVertical } from 'lucide-react';
import type { Assignment } from '@/lib/api';

function fmt(d: string) {
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return '--';
  return dt.toLocaleDateString('en-GB').replace(/\//g, '-');
}

export function AssignmentCard({ a, onDelete }: { a: Assignment; onDelete?: (id: string) => void }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  const goTo = () => {
    if (a.status === 'completed') router.push(`/assignment/${a._id}`);
    else router.push(`/generating/${a._id}`);
  };

  return (
    <div className="relative bg-white rounded-2xl shadow-card hover:shadow-soft transition cursor-pointer p-5" ref={ref}>
      <div onClick={goTo} className="pr-8">
        <div className="font-semibold text-ink-900">{a.title || 'Untitled'}</div>
        <div className="mt-3 flex items-center justify-between text-xs text-ink-600">
          <span>
            <span className="text-ink-500">Assigned on : </span>
            {fmt(a.createdAt)}
          </span>
          <span>
            <span className="text-ink-500">Due : </span>
            {fmt(a.dueDate)}
          </span>
        </div>
        {a.status !== 'completed' && (
          <div className="absolute top-3 left-5 text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 uppercase tracking-wider">
            {a.status}
          </div>
        )}
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="absolute top-3 right-3 p-1.5 rounded-md hover:bg-ink-50 text-ink-500"
        aria-label="More"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {open && (
        <div
          className="absolute z-10 right-3 top-12 w-44 bg-white rounded-xl shadow-lg border border-ink-100 py-1 text-sm"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              setOpen(false);
              goTo();
            }}
            className="w-full text-left px-3 py-2 hover:bg-ink-50 text-ink-800"
          >
            View Assignment
          </button>
          <button
            onClick={() => {
              setOpen(false);
              onDelete?.(a._id);
            }}
            className="w-full text-left px-3 py-2 hover:bg-rose-50 text-rose-600"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
