import clsx from 'clsx';
import type { Difficulty } from '@/lib/api';

const styles: Record<Difficulty, string> = {
  easy: 'text-emerald-700',
  moderate: 'text-amber-700',
  hard: 'text-rose-700',
};

const labels: Record<Difficulty, string> = {
  easy: 'Easy',
  moderate: 'Moderate',
  hard: 'Challenging',
};

/** Inline tag like [Easy] / [Moderate] / [Challenging] used in the paper */
export function InlineDifficulty({ d }: { d: Difficulty }) {
  return <span className={clsx('font-semibold', styles[d])}>[{labels[d]}]</span>;
}
