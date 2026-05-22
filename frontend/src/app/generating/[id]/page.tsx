'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { getAssignment } from '@/lib/api';
import { getSocket, type AssignmentUpdate } from '@/lib/socket';
import { Loader2, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

export default function GeneratingPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const [progress, setProgress] = useState(5);
  const [status, setStatus] = useState<'queued' | 'processing' | 'completed' | 'failed'>('queued');
  const [message, setMessage] = useState('Queued for generation…');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;

    getAssignment(id).then((a) => {
      setStatus(a.status);
      setProgress(a.progress || 5);
      if (a.status === 'completed') router.replace(`/assignment/${id}`);
      if (a.status === 'failed') setError(a.error || 'Generation failed');
    });

    const sock = getSocket();
    const onConnect = () => sock.emit('subscribe', id);
    sock.on('connect', onConnect);
    if (sock.connected) sock.emit('subscribe', id);

    const onUpdate = (u: AssignmentUpdate) => {
      if (u.assignmentId !== id) return;
      setStatus(u.status);
      setProgress(u.progress);
      if (u.message) setMessage(u.message);
      if (u.error) setError(u.error);
      if (u.status === 'completed') {
        setTimeout(() => router.replace(`/assignment/${id}`), 500);
      }
    };
    sock.on('assignment:update', onUpdate);

    const poll = setInterval(async () => {
      try {
        const a = await getAssignment(id);
        setStatus(a.status);
        setProgress(a.progress || 0);
        if (a.status === 'completed') {
          clearInterval(poll);
          router.replace(`/assignment/${id}`);
        }
        if (a.status === 'failed') {
          clearInterval(poll);
          setError(a.error || 'Generation failed');
        }
      } catch {}
    }, 4000);

    return () => {
      sock.emit('unsubscribe', id);
      sock.off('connect', onConnect);
      sock.off('assignment:update', onUpdate);
      clearInterval(poll);
    };
  }, [id, router]);

  return (
    <AppShell title="Create Assignment">
      <div className="px-4 sm:px-8 py-10 max-w-md mx-auto w-full">
        <div className="bg-white border border-ink-100 rounded-3xl p-8 text-center shadow-card">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-brand-100 text-brand-700 grid place-items-center">
            {status === 'completed' ? (
              <CheckCircle2 className="w-7 h-7" />
            ) : status === 'failed' ? (
              <AlertCircle className="w-7 h-7 text-rose-600" />
            ) : (
              <Sparkles className="w-7 h-7 animate-pulse" />
            )}
          </div>
          <h1 className="text-xl font-bold mt-5 text-ink-900">
            {status === 'completed'
              ? 'Ready!'
              : status === 'failed'
                ? 'Something went wrong'
                : 'Generating your paper'}
          </h1>
          <p className="text-ink-500 mt-2 text-sm">{error || message}</p>

          <div className="mt-7">
            <div className="h-2.5 w-full bg-ink-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-500 transition-[width] duration-500 ease-out"
                style={{ width: `${Math.max(progress, status === 'completed' ? 100 : 5)}%` }}
              />
            </div>
            <div className="mt-2 text-xs text-ink-500 flex items-center justify-center gap-2">
              {status !== 'completed' && status !== 'failed' && (
                <Loader2 className="w-3 h-3 animate-spin" />
              )}
              <span>{Math.round(progress)}%</span>
            </div>
          </div>

          {status === 'failed' && (
            <button
              onClick={() => router.push('/create')}
              className="mt-6 px-5 py-2 rounded-full bg-ink-900 text-white text-sm font-medium hover:bg-ink-800"
            >
              Try again
            </button>
          )}
        </div>
      </div>
    </AppShell>
  );
}
