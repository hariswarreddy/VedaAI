import { create } from "zustand";
import type { QuestionConfigItem } from "@/lib/api";

export interface DraftState {
  title: string;
  school: string;
  subject: string;
  gradeLevel: string;
  timeAllowedMinutes: number;
  dueDate: string; // yyyy-mm-dd
  instructions: string;
  file: File | null;
  questionConfig: QuestionConfigItem[];

  setField: <
    K extends keyof Omit<
      DraftState,
      "setField" | "setFile" | "setConfig" | "reset"
    >,
  >(
    key: K,
    value: DraftState[K],
  ) => void;
  setFile: (f: File | null) => void;
  setConfig: (cfg: QuestionConfigItem[]) => void;
  reset: () => void;
}

const initial: Omit<
  DraftState,
  "setField" | "setFile" | "setConfig" | "reset"
> = {
  title: "",
  school: "",
  subject: "",
  gradeLevel: "",
  timeAllowedMinutes: 45,
  dueDate: "",
  instructions: "",
  file: null,
  questionConfig: [
    { type: "mcq", count: 4, marks: 1, difficulty: "easy" },
    { type: "short", count: 3, marks: 2, difficulty: "moderate" },
  ],
};

export const useDraft = create<DraftState>((set) => ({
  ...initial,
  setField: (key, value) => set({ [key]: value } as any),
  setFile: (f) => set({ file: f }),
  setConfig: (cfg) => set({ questionConfig: cfg }),
  reset: () => set({ ...initial }),
}));
