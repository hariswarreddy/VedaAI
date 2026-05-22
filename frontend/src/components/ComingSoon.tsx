import { AppShell } from './AppShell';
import { Sparkles } from 'lucide-react';

export function ComingSoon({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <AppShell title={title}>
      <div className="px-6 py-16 max-w-xl mx-auto text-center">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-brand-100 text-brand-600 grid place-items-center">
          <Sparkles className="w-8 h-8" />
        </div>
        <h1 className="mt-5 text-2xl font-bold text-ink-900">{title}</h1>
        <p className="mt-2 text-sm text-ink-500">
          {description ||
            "We're putting the finishing touches on this. Check back soon!"}
        </p>
        <div className="mt-6 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-ink-100 text-ink-700 text-xs font-medium">
          Coming Soon
        </div>
      </div>
    </AppShell>
  );
}
