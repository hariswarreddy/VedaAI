import { Schema, model, InferSchemaType } from "mongoose";

const QuestionSchema = new Schema(
  {
    text: { type: String, required: true },
    type: { type: String, required: true }, // mcq | short | long | true_false | fill
    difficulty: {
      type: String,
      enum: ["easy", "moderate", "hard"],
      required: true,
    },
    marks: { type: Number, required: true },
    options: { type: [String], default: undefined }, // for mcq
    answer: { type: String }, // optional teacher-only answer
  },
  { _id: false },
);

const SectionSchema = new Schema(
  {
    title: { type: String, required: true }, // "Section A"
    instruction: { type: String, default: "Attempt all questions." },
    questions: { type: [QuestionSchema], default: [] },
  },
  { _id: false },
);

const AssignmentSchema = new Schema(
  {
    title: { type: String, required: true },
    school: { type: String, default: "" },
    subject: { type: String, default: "" },
    gradeLevel: { type: String, default: "" },
    timeAllowedMinutes: { type: Number, default: 0 },
    dueDate: { type: Date, required: true },
    instructions: { type: String, default: "" },
    sourceText: { type: String, default: "" }, // extracted from PDF/text upload
    sourceFileName: { type: String, default: "" },
    questionConfig: {
      type: [
        new Schema(
          {
            type: { type: String, required: true },
            count: { type: Number, required: true, min: 1 },
            marks: { type: Number, required: true, min: 1 },
            difficulty: {
              type: String,
              enum: ["easy", "moderate", "hard", "mixed"],
              default: "mixed",
            },
          },
          { _id: false },
        ),
      ],
      default: [],
    },
    totalMarks: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["queued", "processing", "completed", "failed"],
      default: "queued",
    },
    progress: { type: Number, default: 0 },
    error: { type: String, default: "" },
    sections: { type: [SectionSchema], default: [] },
    jobId: { type: String, default: "" },
  },
  { timestamps: true },
);

export type AssignmentDoc = InferSchemaType<typeof AssignmentSchema>;
export const Assignment = model("Assignment", AssignmentSchema);
