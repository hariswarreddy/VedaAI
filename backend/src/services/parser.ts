import { z } from 'zod';
import type { QuestionConfigItem } from './prompt';

const QuestionSchema = z.object({
  text: z.string().min(1),
  type: z.string().min(1),
  difficulty: z.enum(['easy', 'moderate', 'hard']),
  marks: z.number().positive(),
  options: z.array(z.string()).optional(),
  answer: z.string().optional(),
});

const SectionSchema = z.object({
  title: z.string().min(1),
  instruction: z.string().default('Attempt all questions.'),
  questions: z.array(QuestionSchema).min(1),
});

const PaperSchema = z.object({
  sections: z.array(SectionSchema).min(1),
});

export type ParsedQuestion = z.infer<typeof QuestionSchema>;
export type ParsedSection = z.infer<typeof SectionSchema>;
export type ParsedPaper = z.infer<typeof PaperSchema>;

/**
 * Robustly extract a JSON object from an LLM response string.
 */
function extractJSON(raw: string): unknown {
  // Strip code fences if present
  let s = raw.trim();
  if (s.startsWith('```')) {
    s = s.replace(/^```(?:json)?\s*/i, '').replace(/```$/, '').trim();
  }
  // Find first { ... last }
  const first = s.indexOf('{');
  const last = s.lastIndexOf('}');
  if (first === -1 || last === -1 || last <= first) {
    throw new Error('No JSON object found in LLM response');
  }
  const candidate = s.slice(first, last + 1);
  return JSON.parse(candidate);
}

/**
 * Parse + validate + reconcile against the requested config.
 * If the LLM produced a wrong count/marks, we coerce so the saved data is consistent.
 */
export function parseAndValidate(raw: string, config: QuestionConfigItem[]): ParsedPaper {
  const json = extractJSON(raw);
  const parsed = PaperSchema.parse(json);

  // Reconcile sections with config (truncate/pad questions, align marks/types)
  const reconciled: ParsedPaper = {
    sections: config.map((cfg, i) => {
      const label = String.fromCharCode(65 + i);
      const src = parsed.sections[i] || {
        title: `Section ${label}`,
        instruction: 'Attempt all questions.',
        questions: [],
      };
      let qs = src.questions.slice(0, cfg.count);
      // Trim extras; if too few, keep what we have (worker may fail loudly elsewhere).
      qs = qs.map((q) => {
        const out: ParsedQuestion = {
          text: q.text.trim(),
          type: cfg.type,
          difficulty: q.difficulty,
          marks: cfg.marks,
          options: cfg.type === 'mcq' ? (q.options || []).slice(0, 4) : undefined,
          answer: q.answer,
        };
        // Normalize difficulty for non-"mixed" config
        if (cfg.difficulty !== 'mixed') {
          out.difficulty = cfg.difficulty;
        }
        return out;
      });
      return {
        title: src.title || `Section ${label}`,
        instruction: src.instruction || 'Attempt all questions.',
        questions: qs,
      };
    }),
  };

  return reconciled;
}
