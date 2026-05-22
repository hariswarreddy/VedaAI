'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Filter, Plus, Search, Loader2 } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { EmptyState } from '@/components/EmptyState';
import { AssignmentCard } from '@/components/AssignmentCard';
import { listAssignments, deleteAssignment, type Assignment } from '@/lib/api';

export default function HomePage() {
  const router = useRouter();
  const [items, setItems] = useState<Assignment[] | null>(null);
  const [query, setQuery] = useState('');

  async function refresh() {
    try {
      const rows = await listAssignments();
      setItems(rows);
    } catch {
      setItems([]);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleDelete(id: string) {
    if (!confirm('Delete this assignment?')) return;
    await deleteAssignment(id);
    refresh();
  }

  const filtered = (items || []).filter((a) =>
    a.title.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <AppShell title="Assignments">
      <div className="px-4 sm:px-8 py-6 max-w-6xl mx-auto w-full">
        {/* Header */}
        <div className="flex items-start gap-3 mb-6">
          <span className="mt-1.5 w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
          <div>
            <h1 className="text-xl font-bold text-ink-900">Assignments</h1>
            <p className="text-sm text-ink-500 mt-0.5">
              Manage and create assignments for your classes.
            </p>
          </div>
        </div>

        {items === null ? (
          <div className="py-20 grid place-items-center">
            <Loader2 className="w-6 h-6 animate-spin text-ink-300" />
          </div>
        ) : items.length === 0 ? (
          <EmptyState onCreate={() => router.push('/create')} />
        ) : (
          <>
            {/* Filter bar */}
            <div className="flex flex-col sm:flex-row gap-3 mb-5">
              <button className="inline-flex items-center gap-2 px-3 py-2 rounded-full border border-ink-200 bg-white text-sm text-ink-600 hover:bg-ink-50">
                <Filter className="w-4 h-4" />
                Filter By
              </button>
              <div className="relative flex-1 sm:max-w-md sm:ml-auto">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search Assignment"
                  className="w-full pl-9 pr-3 py-2 rounded-full border border-ink-200 bg-white text-sm focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                />
              </div>
            </div>

            {/* Cards grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-24">
              {filtered.map((a) => (
                <AssignmentCard key={a._id} a={a} onDelete={handleDelete} />
              ))}
            </div>

            {/* Floating Create CTA (desktop) */}
            <button
              onClick={() => router.push('/create')}
              className="hidden lg:inline-flex items-center gap-2 fixed bottom-8 left-1/2 -translate-x-1/2 px-5 py-3 rounded-full bg-ink-900 hover:bg-ink-800 text-white text-sm font-medium shadow-lg z-10"
            >
              <Plus className="w-4 h-4" />
              Create Assignment
            </button>
          </>
        )}
      </div>
    </AppShell>
  );
}
