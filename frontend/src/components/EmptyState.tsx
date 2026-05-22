import { useRouter } from 'next/navigation';
import { Plus, FileX } from 'lucide-react';

export function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-16">
      <div className="relative w-44 h-44">
        {/* Stylized illustration */}
        <div className="absolute inset-0 rounded-full bg-ink-100/70" />
        <div className="absolute left-6 top-6 w-28 h-32 bg-white rounded-md shadow-sm border border-ink-200">
          <div className="px-3 pt-3 space-y-1.5">
            <div className="h-2 w-3/4 rounded bg-ink-200" />
            <div className="h-2 w-1/2 rounded bg-ink-200" />
            <div className="h-2 w-2/3 rounded bg-ink-200" />
          </div>
        </div>
        {/* magnifier with X */}
        <div className="absolute right-3 bottom-3 w-20 h-20 rounded-full border-[3px] border-ink-300 bg-white grid place-items-center shadow-sm">
          <FileX className="w-9 h-9 text-rose-500" strokeWidth={2.2} />
        </div>
        <div className="absolute right-1 bottom-1 w-2.5 h-7 rotate-45 bg-ink-300 rounded" />
      </div>
      <h2 className="mt-6 text-lg font-semibold text-ink-900">No assignments yet</h2>
      <p className="mt-2 max-w-md text-sm text-ink-500">
        Create your first assignment to start collecting and grading student submissions.
        You can set up rubrics, define marking criteria, and let AI assist with grading.
      </p>
      <button
        onClick={onCreate}
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-ink-900 hover:bg-ink-800 text-white text-sm font-medium px-5 py-2.5"
      >
        <Plus className="w-4 h-4" />
        Create Your First Assignment
      </button>
    </div>
  );
}
