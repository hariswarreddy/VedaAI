export interface QuestionConfigItem {
  type: string; // mcq | short | long | true_false | fill | diagram | numerical
  count: number;
  marks: number;
  difficulty: "easy" | "moderate" | "hard" | "mixed";
}

export interface PromptInput {
  title: string;
  school?: string;
  subject?: string;
  gradeLevel?: string;
  timeAllowedMinutes?: number;
  instructions?: string;
  sourceText?: string;
  questionConfig: QuestionConfigItem[];
}

const TYPE_LABEL: Record<string, string> = {
  mcq: "Multiple Choice Questions (provide exactly 4 options each)",
  short: "Short Answer Questions",
  long: "Long Answer Questions",
  true_false: "True/False Questions",
  fill: "Fill in the Blanks",
  diagram:
    "Diagram/Graph-Based Questions (describe the diagram in words; do not embed images)",
  numerical:
    "Numerical Problems (must be solvable with given data; show units)",
};

export function buildPrompt(input: PromptInput): {
  system: string;
  user: string;
} {
  const sections = input.questionConfig
    .map((c, i) => {
      const label = String.fromCharCode(65 + i); // A, B, C...
      return `Section ${label}: ${c.count} ${TYPE_LABEL[c.type] || c.type} — ${c.marks} marks each — difficulty: ${c.difficulty}`;
    })
    .join("\n");

  const source = (input.sourceText || "").slice(0, 8000); // truncate for token budget

  const system = `You are an expert exam paper author. You ONLY return valid JSON matching the requested schema. No prose, no markdown fences, no commentary.`;

  const user = `Create an exam/assessment titled "${input.title}".
School: ${input.school || "Not specified"}
Subject: ${input.subject || "General"}
Grade/Level: ${input.gradeLevel || "Not specified"}
Time allowed: ${input.timeAllowedMinutes ? input.timeAllowedMinutes + " minutes" : "Not specified"}
Additional instructions from teacher: ${input.instructions || "None"}

Build the following sections (one section per config row, labeled A, B, C, ... in order):
${sections}

${source ? `Use the following SOURCE MATERIAL as the basis for question content (do not invent unrelated facts):\n"""\n${source}\n"""` : "No source material provided — generate appropriate questions for the subject/level."}

Difficulty rules:
- "easy" -> straightforward recall.
- "moderate" -> application/understanding.
- "hard" -> analysis/synthesis.
- "mixed" -> distribute easy/moderate/hard roughly evenly across that section's questions.

Return ONLY a JSON object with this exact shape:
{
  "sections": [
    {
      "title": "Section A",
      "instruction": "Attempt all questions.",
      "questions": [
        {
          "text": "string (the question)",
          "type": "mcq | short | long | true_false | fill",
          "difficulty": "easy | moderate | hard",
          "marks": number,
          "options": ["A) ...","B) ...","C) ...","D) ..."],   // ONLY for mcq, omit otherwise
          "answer": "string"                                  // brief answer/key, optional
        }
      ]
    }
  ]
}

Constraints:
- Every section must have EXACTLY the requested number of questions.
- Each question's "marks" must equal the marks specified for that section.
- "type" must match the section's configured type.
- For mcq: exactly 4 options, only ONE correct, "answer" is the correct option text (e.g., "B) ...").
- For true_false: "answer" is "True" or "False".
- Keep questions self-contained and unambiguous.
- Do NOT include any text outside the JSON object.`;

  return { system, user };
}
