export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export type Difficulty = "easy" | "moderate" | "hard";

export interface Question {
  text: string;
  type: string;
  difficulty: Difficulty;
  marks: number;
  options?: string[];
  answer?: string;
}

export interface Section {
  title: string;
  instruction: string;
  questions: Question[];
}

export type QuestionType =
  | "mcq"
  | "short"
  | "long"
  | "true_false"
  | "fill"
  | "diagram"
  | "numerical";

export interface QuestionConfigItem {
  type: QuestionType;
  count: number;
  marks: number;
  difficulty: "easy" | "moderate" | "hard" | "mixed";
}

export interface Assignment {
  _id: string;
  title: string;
  school?: string;
  subject?: string;
  gradeLevel?: string;
  timeAllowedMinutes?: number;
  dueDate: string;
  instructions?: string;
  sourceFileName?: string;
  questionConfig: QuestionConfigItem[];
  totalMarks: number;
  status: "queued" | "processing" | "completed" | "failed";
  progress: number;
  error?: string;
  sections: Section[];
  createdAt: string;
  updatedAt: string;
}

export async function createAssignment(
  form: FormData,
): Promise<{ id: string; status: string }> {
  const res = await fetch(`${API_URL}/api/assignments`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to create assignment");
  }
  return res.json();
}

export async function getAssignment(id: string): Promise<Assignment> {
  const res = await fetch(`${API_URL}/api/assignments/${id}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch assignment");
  return res.json();
}

export async function regenerate(
  id: string,
): Promise<{ id: string; status: string }> {
  const res = await fetch(`${API_URL}/api/assignments/${id}/regenerate`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to regenerate");
  return res.json();
}

export async function deleteAssignment(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/assignments/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete");
}

export async function listAssignments(): Promise<Assignment[]> {
  const res = await fetch(`${API_URL}/api/assignments`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to list assignments");
  return res.json();
}
