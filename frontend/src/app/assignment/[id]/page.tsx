'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Download, Loader2, RefreshCw } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { InlineDifficulty } from '@/components/DifficultyTag';
import { getAssignment, regenerate, type Assignment } from '@/lib/api';

export default function AssignmentPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [a, setA] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [regenLoading, setRegenLoading] = useState(false);
  const paperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!params.id) return;
    getAssignment(params.id)
      .then(setA)
      .finally(() => setLoading(false));
  }, [params.id]);

  async function handleRegenerate() {
    if (!a) return;
    setRegenLoading(true);
    try {
      await regenerate(a._id);
      router.push(`/generating/${a._id}`);
    } finally {
      setRegenLoading(false);
    }
  }

  async function handleDownloadPDF() {
    if (!paperRef.current) return;
    setPdfLoading(true);
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);
      const canvas = await html2canvas(paperRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth - 40;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let position = 20;
      let heightLeft = imgHeight;
      pdf.addImage(imgData, 'PNG', 20, position, imgWidth, imgHeight);
      heightLeft -= pageHeight - 40;
      while (heightLeft > 0) {
        position = heightLeft - imgHeight + 20;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 20, position, imgWidth, imgHeight);
        heightLeft -= pageHeight - 40;
      }
      pdf.save(`${(a?.title || 'assessment').replace(/[^a-z0-9]+/gi, '_')}.pdf`);
    } finally {
      setPdfLoading(false);
    }
  }

  if (loading) {
    return (
      <AppShell title="Create New" hideMobileNav>
        <div className="grid place-items-center py-24">
          <Loader2 className="w-6 h-6 animate-spin text-ink-300" />
        </div>
      </AppShell>
    );
  }
  if (!a) {
    return (
      <AppShell title="Create New" hideMobileNav>
        <div className="text-center py-20 text-ink-500">Assignment not found.</div>
      </AppShell>
    );
  }
  if (a.status !== 'completed') {
    return (
      <AppShell title="Create New" hideMobileNav>
        <div className="text-center py-20 text-ink-500">
          Still {a.status}.{' '}
          <Link href={`/generating/${a._id}`} className="text-brand-600 hover:underline">
            View progress →
          </Link>
        </div>
      </AppShell>
    );
  }

  // Build flat answer list across sections
  const answers: { qNo: number; text: string; ans?: string }[] = [];
  let qCounter = 0;
  for (const sec of a.sections) {
    for (const q of sec.questions) {
      qCounter += 1;
      answers.push({ qNo: qCounter, text: q.text, ans: q.answer });
    }
  }

  const time = a.timeAllowedMinutes ? `${a.timeAllowedMinutes} minutes` : '—';
  const headerSchool = a.school || 'Delhi Public School, Sector-4, Bokaro';
  const headerSubject = a.subject || 'General';
  const headerClass = a.gradeLevel || '—';

  return (
    <AppShell title="Create New" hideMobileNav>
      <div className="px-4 sm:px-8 py-6 max-w-4xl mx-auto w-full">
        {/* Top intro card */}
        <div className="bg-ink-900 text-white rounded-2xl p-5 sm:p-6 no-print">
          <p className="text-sm leading-relaxed">
            Certainly! Here&rsquo;s a customized Question Paper for your{' '}
            <span className="font-semibold">{headerSubject}</span>
            {a.gradeLevel ? <> &middot; <span className="font-semibold">{headerClass}</span></> : null}{' '}
            class.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={handleDownloadPDF}
              disabled={pdfLoading}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white text-ink-900 text-sm font-medium hover:bg-ink-100 disabled:opacity-60"
            >
              {pdfLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Download as PDF
            </button>
            <button
              onClick={handleRegenerate}
              disabled={regenLoading}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-white text-sm font-medium hover:bg-white/20 disabled:opacity-60"
            >
              {regenLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Regenerate
            </button>
          </div>
        </div>

        {/* Paper */}
        <article
          ref={paperRef}
          className="paper mt-6 bg-white rounded-2xl shadow-card px-6 sm:px-12 py-10 font-serif text-ink-900"
        >
          {/* Header */}
          <header className="text-center">
            <h1 className="text-xl sm:text-2xl font-bold">{headerSchool}</h1>
            <p className="mt-1 text-sm">Subject: {headerSubject}</p>
            <p className="text-sm">Class: {headerClass}</p>
          </header>

          <div className="mt-5 flex justify-between text-sm">
            <span>Time Allowed: {time}</span>
            <span>Maximum Marks: {a.totalMarks}</span>
          </div>

          <p className="mt-3 text-sm">All questions are compulsory unless stated otherwise.</p>

          <div className="mt-5 space-y-2 text-sm font-sans">
            <div>Name: <span className="inline-block min-w-[200px] border-b border-ink-300">&nbsp;</span></div>
            <div>Roll Number: <span className="inline-block min-w-[200px] border-b border-ink-300">&nbsp;</span></div>
            <div>Class: {headerClass} &nbsp; Section: <span className="inline-block min-w-[120px] border-b border-ink-300">&nbsp;</span></div>
          </div>

          {/* Sections */}
          {a.sections.map((sec) => (
            <section key={sec.title} className="mt-8">
              <h2 className="text-center text-base font-bold tracking-wide">{sec.title}</h2>
              <p className="mt-1 text-sm font-semibold">
                {humanizeType(sec.questions[0]?.type)}
              </p>
              <p className="text-xs italic text-ink-600">{sec.instruction}</p>

              <ol className="mt-3 space-y-2 text-sm font-sans list-none">
                {sec.questions.map((q, i) => {
                  // global counter offset per section is not needed here — Figma shows sequential within section
                  return (
                    <li key={i} className="flex gap-2">
                      <span className="shrink-0">{i + 1}.</span>
                      <div className="flex-1">
                        <InlineDifficulty d={q.difficulty} />{' '}
                        <span>{q.text}</span>{' '}
                        <span className="text-ink-700">[{q.marks} {q.marks === 1 ? 'Mark' : 'Marks'}]</span>

                        {q.type === 'mcq' && q.options && q.options.length > 0 && (
                          <ul className="mt-1 ml-1 grid sm:grid-cols-2 gap-x-6 gap-y-0.5 text-ink-800">
                            {q.options.map((o, oi) => (
                              <li key={oi}>{o}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>
          ))}

          {/* End */}
          <p className="mt-8 font-semibold text-sm">End of Question Paper</p>

          {/* Answer Key */}
          {answers.some((x) => x.ans) && (
            <section className="mt-10">
              <h3 className="font-bold">Answer Key</h3>
              <ol className="mt-2 space-y-2 text-sm font-sans list-decimal pl-5">
                {answers.map((x) =>
                  x.ans ? (
                    <li key={x.qNo} className="text-ink-800">
                      {x.ans}
                    </li>
                  ) : null
                )}
              </ol>
            </section>
          )}
        </article>
      </div>
    </AppShell>
  );
}

function humanizeType(t?: string) {
  switch (t) {
    case 'mcq':
      return 'Multiple Choice Questions';
    case 'short':
      return 'Short Answer Questions';
    case 'long':
      return 'Long Answer Questions';
    case 'true_false':
      return 'True / False';
    case 'fill':
      return 'Fill in the Blanks';
    case 'diagram':
      return 'Diagram / Graph-Based Questions';
    case 'numerical':
      return 'Numerical Problems';
    default:
      return '';
  }
}
