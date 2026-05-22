'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  FileText,
  Loader2,
  Mic,
  Minus,
  Plus,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { useDraft } from '@/store/assignmentStore';
import { createAssignment, type QuestionType } from '@/lib/api';

const TYPE_OPTIONS: { value: QuestionType; label: string }[] = [
  { value: 'mcq', label: 'Multiple Choice Questions' },
  { value: 'short', label: 'Short Questions' },
  { value: 'long', label: 'Long Questions' },
  { value: 'true_false', label: 'True / False' },
  { value: 'fill', label: 'Fill in the Blanks' },
  { value: 'diagram', label: 'Diagram/Graph-Based Questions' },
  { value: 'numerical', label: 'Numerical Problems' },
];

export default function CreatePage() {
  const router = useRouter();
  const draft = useDraft();
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');

  const totalQuestions = draft.questionConfig.reduce((s, c) => s + (c.count || 0), 0);
  const totalMarks = draft.questionConfig.reduce((s, c) => s + (c.count || 0) * (c.marks || 0), 0);

  function validate() {
    const e: Record<string, string> = {};
    if (!draft.title.trim()) e.title = 'Title is required';
    if (!draft.dueDate) e.dueDate = 'Due date is required';
    else if (new Date(draft.dueDate).getTime() < Date.now() - 24 * 3600 * 1000)
      e.dueDate = 'Due date must be in the future';
    if (draft.questionConfig.length === 0) e.config = 'Add at least one question section';
    draft.questionConfig.forEach((c, i) => {
      if (!c.count || c.count < 1) e[`count-${i}`] = 'Min 1';
      if (!c.marks || c.marks < 1) e[`marks-${i}`] = 'Min 1';
    });
    if (draft.file && draft.file.size > 10 * 1024 * 1024) e.file = 'File must be ≤ 10MB';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function onSubmit() {
    setServerError('');
    if (!validate()) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('title', draft.title || `Assessment - ${new Date().toLocaleDateString()}`);
      fd.append('school', draft.school);
      fd.append('subject', draft.subject);
      fd.append('gradeLevel', draft.gradeLevel);
      fd.append('timeAllowedMinutes', String(draft.timeAllowedMinutes || 0));
      fd.append('dueDate', new Date(draft.dueDate).toISOString());
      fd.append('instructions', draft.instructions);
      fd.append('questionConfig', JSON.stringify(draft.questionConfig));
      if (draft.file) fd.append('file', draft.file);
      const res = await createAssignment(fd);
      router.push(`/generating/${res.id}`);
    } catch (err: any) {
      setServerError(err.message || 'Something went wrong');
      setSubmitting(false);
    }
  }

  function patchRow(i: number, patch: Partial<(typeof draft.questionConfig)[number]>) {
    draft.setConfig(draft.questionConfig.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  }
  function addRow() {
    draft.setConfig([
      ...draft.questionConfig,
      { type: 'mcq', count: 4, marks: 1, difficulty: 'mixed' },
    ]);
  }
  function removeRow(i: number) {
    draft.setConfig(draft.questionConfig.filter((_, idx) => idx !== i));
  }

  return (
    <AppShell title="Assignment">
      <div className="px-4 sm:px-8 py-6 max-w-3xl mx-auto w-full">
        {/* Title row */}
        <div className="flex items-start gap-3">
          <span className="mt-1.5 w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
          <div>
            <h1 className="text-xl font-bold text-ink-900">Create Assignment</h1>
            <p className="text-sm text-ink-500 mt-0.5">Set up a new assignment for your students</p>
          </div>
        </div>

        {/* Stepper */}
        <div className="mt-5 grid grid-cols-2 gap-3 max-w-md">
          <div className="h-1 rounded-full bg-emerald-500" />
          <div className="h-1 rounded-full bg-ink-200" />
        </div>

        {/* Card */}
        <section className="mt-6 bg-white rounded-2xl shadow-card p-5 sm:p-7 space-y-6">
          <div>
            <h2 className="font-semibold text-ink-900">Assignment Details</h2>
            <p className="text-xs text-ink-500 mt-0.5">Basic information about your assignment</p>
          </div>

          {/* File dropzone */}
          <div>
            <label className="block">
              <input
                type="file"
                className="hidden"
                accept=".pdf,.txt,.png,.jpg,.jpeg,application/pdf,text/plain,image/*"
                onChange={(e) => draft.setFile(e.target.files?.[0] || null)}
              />
              <div
                className={`border-2 border-dashed rounded-xl px-5 py-8 text-center transition cursor-pointer ${
                  draft.file
                    ? 'border-brand-300 bg-brand-50/50'
                    : 'border-ink-200 hover:border-brand-300 hover:bg-ink-50/60'
                }`}
              >
                {draft.file ? (
                  <div className="flex items-center gap-3 justify-center">
                    <FileText className="w-7 h-7 text-brand-500" />
                    <div className="text-left">
                      <div className="text-sm font-medium text-ink-900">{draft.file.name}</div>
                      <div className="text-xs text-ink-500">
                        {(draft.file.size / 1024).toFixed(1)} KB · click to replace
                      </div>
                    </div>
                    <button
                      type="button"
                      className="ml-3 p-1 text-ink-400 hover:text-rose-500"
                      onClick={(e) => {
                        e.preventDefault();
                        draft.setFile(null);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="mx-auto w-10 h-10 rounded-full bg-ink-100 grid place-items-center">
                      <Upload className="w-5 h-5 text-ink-500" />
                    </div>
                    <div className="mt-3 text-sm text-ink-700 font-medium">
                      Choose a file or drag &amp; drop it here
                    </div>
                    <div className="text-[11px] text-ink-400 mt-0.5">PDF, TXT, JPEG, PNG · upto 10MB</div>
                    <button
                      type="button"
                      className="mt-3 inline-flex items-center px-4 py-1.5 rounded-full border border-ink-200 text-xs font-medium text-ink-700 bg-white hover:bg-ink-50"
                    >
                      Browse Files
                    </button>
                  </>
                )}
              </div>
            </label>
            <div className="mt-2 text-center text-[11px] text-ink-400">
              Upload images of your preferred document/image
            </div>
            {errors.file && <p className="text-xs text-rose-500 mt-1">{errors.file}</p>}
          </div>

          {/* Title (used by AI; we keep it visible) */}
          <Field label="Title" error={errors.title}>
            <input
              value={draft.title}
              onChange={(e) => draft.setField('title', e.target.value)}
              placeholder="e.g. Science — Electricity Quiz"
              className="input"
            />
          </Field>

          {/* Subject + Class + School (compact, optional but useful for output) */}
          <div className="grid sm:grid-cols-3 gap-3">
            <Field label="Subject"><input className="input" placeholder="e.g. Science" value={draft.subject} onChange={(e) => draft.setField('subject', e.target.value)} /></Field>
            <Field label="Class"><input className="input" placeholder="e.g. Grade 8" value={draft.gradeLevel} onChange={(e) => draft.setField('gradeLevel', e.target.value)} /></Field>
            <Field label="Time (minutes)">
              <input
                type="number"
                min={0}
                className="input"
                value={draft.timeAllowedMinutes || ''}
                onChange={(e) => draft.setField('timeAllowedMinutes', parseInt(e.target.value || '0', 10))}
                placeholder="45"
              />
            </Field>
          </div>

          {/* Due date */}
          <Field label="Due Date" error={errors.dueDate}>
            <div className="relative">
              <input
                type="date"
                value={draft.dueDate}
                onChange={(e) => draft.setField('dueDate', e.target.value)}
                className="input pr-10"
                placeholder="DD-MM-YYYY"
              />
              <Calendar className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
            </div>
          </Field>

          {/* Question types section */}
          <div>
            {/* Header row (desktop) */}
            <div className="hidden sm:grid grid-cols-12 gap-3 text-xs font-medium text-ink-500 mb-2 px-1">
              <div className="col-span-6">Question Type</div>
              <div className="col-span-3 text-center">No. of Questions</div>
              <div className="col-span-3 text-center">Marks</div>
            </div>

            <div className="space-y-3">
              {draft.questionConfig.map((c, i) => (
                <QuestionRow
                  key={i}
                  index={i}
                  type={c.type}
                  count={c.count}
                  marks={c.marks}
                  errCount={errors[`count-${i}`]}
                  errMarks={errors[`marks-${i}`]}
                  onChange={(patch) => patchRow(i, patch)}
                  onRemove={() => removeRow(i)}
                  removable={draft.questionConfig.length > 1}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={addRow}
              className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-ink-700 hover:text-ink-900"
            >
              <span className="w-6 h-6 grid place-items-center rounded-full bg-ink-900 text-white">
                <Plus className="w-3.5 h-3.5" />
              </span>
              Add Question Type
            </button>

            <div className="mt-4 text-right text-sm text-ink-700 space-y-0.5">
              <div>
                <span className="text-ink-500">Total Questions :</span>{' '}
                <span className="font-medium">{totalQuestions}</span>
              </div>
              <div>
                <span className="text-ink-500">Total Marks :</span>{' '}
                <span className="font-medium">{totalMarks}</span>
              </div>
            </div>
            {errors.config && <p className="text-xs text-rose-500 mt-1">{errors.config}</p>}
          </div>

          {/* Additional info */}
          <Field label="Additional Information (For better output)">
            <div className="relative">
              <textarea
                value={draft.instructions}
                onChange={(e) => draft.setField('instructions', e.target.value)}
                placeholder="e.g. Generate a question paper for 3 hour exam duration..."
                className="input min-h-[88px] pr-10"
              />
              <button
                type="button"
                aria-label="Voice"
                className="absolute right-2 bottom-2 p-2 rounded-full text-ink-400 hover:bg-ink-50"
              >
                <Mic className="w-4 h-4" />
              </button>
            </div>
          </Field>

          {serverError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-lg p-3 text-sm">
              {serverError}
            </div>
          )}
        </section>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-ink-200 bg-white text-sm font-medium text-ink-700 hover:bg-ink-50"
          >
            <ArrowLeft className="w-4 h-4" />
            Previous
          </button>
          <button
            onClick={onSubmit}
            disabled={submitting}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-ink-900 hover:bg-ink-800 text-white text-sm font-medium disabled:opacity-60"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Next
            {!submitting && <ArrowRight className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <style jsx global>{`
        .input {
          width: 100%;
          padding: 0.6rem 0.75rem;
          border: 1px solid #d8d8dc;
          border-radius: 0.6rem;
          background: white;
          font-size: 0.875rem;
          color: #1d1e22;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .input:focus { border-color: #fb813f; box-shadow: 0 0 0 3px rgba(251,129,63,.15); }
        .input::placeholder { color: #b3b4bb; }
      `}</style>
    </AppShell>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-[13px] font-medium text-ink-700 mb-1.5">{label}</span>
      {children}
      {error && <span className="block text-xs text-rose-500 mt-1">{error}</span>}
    </label>
  );
}

function QuestionRow({
  index,
  type,
  count,
  marks,
  errCount,
  errMarks,
  onChange,
  onRemove,
  removable,
}: {
  index: number;
  type: QuestionType;
  count: number;
  marks: number;
  errCount?: string;
  errMarks?: string;
  onChange: (p: Partial<{ type: QuestionType; count: number; marks: number }>) => void;
  onRemove: () => void;
  removable: boolean;
}) {
  return (
    <>
      {/* Desktop layout */}
      <div className="hidden sm:grid grid-cols-12 gap-3 items-center">
        <div className="col-span-6">
          <select
            value={type}
            onChange={(e) => onChange({ type: e.target.value as QuestionType })}
            className="input"
          >
            {TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div className="col-span-1 flex justify-center">
          <button
            type="button"
            onClick={onRemove}
            disabled={!removable}
            className="text-ink-400 hover:text-rose-500 disabled:opacity-30 p-1"
            aria-label="Remove row"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="col-span-2">
          <Stepper value={count} onChange={(v) => onChange({ count: v })} />
          {errCount && <p className="text-[11px] text-rose-500 text-center mt-0.5">{errCount}</p>}
        </div>
        <div className="col-span-3 sm:col-span-3">
          <Stepper value={marks} onChange={(v) => onChange({ marks: v })} />
          {errMarks && <p className="text-[11px] text-rose-500 text-center mt-0.5">{errMarks}</p>}
        </div>
      </div>

      {/* Mobile layout (stacked card) */}
      <div className="sm:hidden p-3 rounded-xl border border-ink-200 bg-white space-y-3">
        <div className="flex items-center gap-2">
          <select
            value={type}
            onChange={(e) => onChange({ type: e.target.value as QuestionType })}
            className="input flex-1"
          >
            {TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={onRemove}
            disabled={!removable}
            className="text-ink-400 hover:text-rose-500 disabled:opacity-30 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-[11px] text-ink-500 mb-1 text-center">No. of Questions</div>
            <Stepper value={count} onChange={(v) => onChange({ count: v })} />
            {errCount && <p className="text-[11px] text-rose-500 text-center mt-0.5">{errCount}</p>}
          </div>
          <div>
            <div className="text-[11px] text-ink-500 mb-1 text-center">Marks</div>
            <Stepper value={marks} onChange={(v) => onChange({ marks: v })} />
            {errMarks && <p className="text-[11px] text-rose-500 text-center mt-0.5">{errMarks}</p>}
          </div>
        </div>
      </div>
    </>
  );
}

function Stepper({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between gap-2 border border-ink-200 rounded-full px-2 py-1 bg-white">
      <button
        type="button"
        onClick={() => onChange(Math.max(1, (value || 0) - 1))}
        className="w-6 h-6 grid place-items-center rounded-full hover:bg-ink-100 text-ink-700"
      >
        <Minus className="w-3.5 h-3.5" />
      </button>
      <input
        type="number"
        value={value || 0}
        onChange={(e) => onChange(Math.max(0, parseInt(e.target.value || '0', 10)))}
        className="w-8 text-center text-sm bg-transparent outline-none"
      />
      <button
        type="button"
        onClick={() => onChange((value || 0) + 1)}
        className="w-6 h-6 grid place-items-center rounded-full hover:bg-ink-100 text-ink-700"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
