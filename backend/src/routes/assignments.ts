import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { Assignment } from "../models/Assignment";
import { generationQueue } from "../queue";
import pdfParse from "pdf-parse";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

export const assignmentsRouter = Router();

const QuestionConfigSchema = z.object({
  type: z.enum([
    "mcq",
    "short",
    "long",
    "true_false",
    "fill",
    "diagram",
    "numerical",
  ]),
  count: z.coerce.number().int().min(1).max(50),
  marks: z.coerce.number().int().min(1).max(100),
  difficulty: z.enum(["easy", "moderate", "hard", "mixed"]).default("mixed"),
});

const CreateSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  school: z.string().max(150).optional().default(""),
  subject: z.string().max(100).optional().default(""),
  gradeLevel: z.string().max(50).optional().default(""),
  timeAllowedMinutes: z.coerce
    .number()
    .int()
    .min(0)
    .max(600)
    .optional()
    .default(0),
  dueDate: z.coerce
    .date()
    .refine(
      (d) => d.getTime() > Date.now() - 60_000,
      "Due date must be in the future",
    ),
  instructions: z.string().max(2000).optional().default(""),
  questionConfig: z
    .array(QuestionConfigSchema)
    .min(1, "Add at least one question type"),
});

// POST /api/assignments  (multipart: file + json fields)
assignmentsRouter.post("/", upload.single("file"), async (req, res) => {
  try {
    // questionConfig comes as JSON string in multipart
    const payload = {
      ...req.body,
      questionConfig:
        typeof req.body.questionConfig === "string"
          ? JSON.parse(req.body.questionConfig)
          : req.body.questionConfig,
    };

    const parsed = CreateSchema.safeParse(payload);
    if (!parsed.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: parsed.error.flatten(),
      });
    }
    const data = parsed.data;

    // Extract text from optional file
    let sourceText = "";
    let sourceFileName = "";
    if (req.file) {
      sourceFileName = req.file.originalname;
      const mime = req.file.mimetype;
      if (
        mime === "application/pdf" ||
        sourceFileName.toLowerCase().endsWith(".pdf")
      ) {
        try {
          const parsedPdf = await pdfParse(req.file.buffer);
          sourceText = parsedPdf.text || "";
        } catch (e: any) {
          return res
            .status(400)
            .json({ error: "Failed to parse PDF", details: e.message });
        }
      } else if (
        mime.startsWith("text/") ||
        sourceFileName.toLowerCase().endsWith(".txt")
      ) {
        sourceText = req.file.buffer.toString("utf-8");
      } else if (mime.startsWith("image/")) {
        // Image upload accepted; OCR not implemented, so source text stays empty.
        sourceText = "";
      } else {
        return res
          .status(400)
          .json({ error: "Only PDF, text, or image files are supported" });
      }
    }

    const assignment = await Assignment.create({
      title: data.title,
      school: data.school,
      subject: data.subject,
      gradeLevel: data.gradeLevel,
      timeAllowedMinutes: data.timeAllowedMinutes,
      dueDate: data.dueDate,
      instructions: data.instructions,
      sourceText,
      sourceFileName,
      questionConfig: data.questionConfig,
      status: "queued",
      progress: 0,
    });

    const job = await generationQueue.add("generate", {
      assignmentId: assignment._id.toString(),
    });
    assignment.jobId = job.id || "";
    await assignment.save();

    return res
      .status(201)
      .json({ id: assignment._id, status: assignment.status });
  } catch (e: any) {
    console.error(e);
    return res
      .status(500)
      .json({ error: "Internal error", details: e.message });
  }
});

// GET /api/assignments/:id
assignmentsRouter.get("/:id", async (req, res) => {
  try {
    const a = await Assignment.findById(req.params.id);
    if (!a) return res.status(404).json({ error: "Not found" });
    return res.json(a);
  } catch (e: any) {
    return res.status(400).json({ error: "Invalid id" });
  }
});

// GET /api/assignments  (list, recent first)
assignmentsRouter.get("/", async (_req, res) => {
  const items = await Assignment.find()
    .sort({ createdAt: -1 })
    .limit(50)
    .select(
      "title school subject gradeLevel dueDate status progress totalMarks createdAt",
    );
  res.json(items);
});

// DELETE /api/assignments/:id
assignmentsRouter.delete("/:id", async (req, res) => {
  try {
    const r = await Assignment.findByIdAndDelete(req.params.id);
    if (!r) return res.status(404).json({ error: "Not found" });
    return res.json({ ok: true });
  } catch (e: any) {
    return res.status(400).json({ error: "Invalid id" });
  }
});

// POST /api/assignments/:id/regenerate
assignmentsRouter.post("/:id/regenerate", async (req, res) => {
  const a = await Assignment.findById(req.params.id);
  if (!a) return res.status(404).json({ error: "Not found" });
  a.status = "queued";
  a.progress = 0;
  a.error = "";
  a.sections = [] as any;
  await a.save();
  const job = await generationQueue.add("generate", {
    assignmentId: a._id.toString(),
  });
  a.jobId = job.id || "";
  await a.save();
  res.json({ id: a._id, status: a.status });
});
