import { Worker } from "bullmq";
import { redisConnection, cache } from "../db/redis";
import { connectMongo } from "../db/mongo";
import { Assignment } from "../models/Assignment";
import { buildPrompt } from "../services/prompt";
import { groqChat } from "../services/groq";
import { parseAndValidate } from "../services/parser";
import { GENERATION_QUEUE } from "./index";
import {
  initSocket,
  emitAssignmentUpdate,
  emitAssignmentDone,
} from "../ws/socket";
import http from "http";
import { env } from "../config/env";

/**
 * The worker can run in two modes:
 *  - same-process: imported by the API server; uses the shared socket.io instance.
 *  - standalone:   run with `npm run worker`; spins up its own tiny HTTP+socket.io
 *                  on PORT+1 so frontend clients listening via the API server still
 *                  receive updates *if* you front them with the same Redis adapter.
 *
 * For simplicity here, when running standalone we also persist progress to the DB
 * (which the API polls/serves), so the frontend will still resolve via REST even
 * if it misses a ws event.
 */

let standaloneSocketReady = false;

function ensureStandaloneSocket() {
  if (standaloneSocketReady) return;
  const server = http.createServer();
  initSocket(server);
  server.listen(env.PORT + 1, () => {
    console.log(`[worker] standalone socket listening on :${env.PORT + 1}`);
  });
  standaloneSocketReady = true;
}

export function startWorker() {
  const worker = new Worker(
    GENERATION_QUEUE,
    async (job) => {
      const { assignmentId } = job.data as { assignmentId: string };
      const assignment = await Assignment.findById(assignmentId);
      if (!assignment) throw new Error(`Assignment ${assignmentId} not found`);

      const update = async (
        progress: number,
        message: string,
        status: string = "processing",
      ) => {
        assignment.status = status as any;
        assignment.progress = progress;
        await assignment.save();
        emitAssignmentUpdate(assignmentId, { status, progress, message });
      };

      try {
        await update(10, "Preparing prompt…");

        const { system, user } = buildPrompt({
          title: assignment.title,
          school: (assignment as any).school,
          subject: assignment.subject,
          gradeLevel: assignment.gradeLevel,
          timeAllowedMinutes: (assignment as any).timeAllowedMinutes,
          instructions: assignment.instructions,
          sourceText: assignment.sourceText,
          questionConfig: assignment.questionConfig as any,
        });

        await update(30, "Calling AI model…");

        // Cache by a hash of inputs to avoid re-calls
        const cacheKey = `gen:${assignmentId}`;
        let raw = await cache.get(cacheKey);
        if (!raw) {
          raw = await groqChat([
            { role: "system", content: system },
            { role: "user", content: user },
          ]);
          await cache.set(cacheKey, raw, "EX", 60 * 60); // 1h
        }

        await update(70, "Parsing & validating…");

        const parsed = parseAndValidate(raw, assignment.questionConfig as any);

        assignment.sections = parsed.sections as any;
        assignment.totalMarks = parsed.sections.reduce(
          (sum, s) =>
            sum + s.questions.reduce((qs, q) => qs + (q.marks || 0), 0),
          0,
        );
        assignment.status = "completed";
        assignment.progress = 100;
        assignment.error = "";
        await assignment.save();

        emitAssignmentUpdate(assignmentId, {
          status: "completed",
          progress: 100,
          message: "Done",
        });
        emitAssignmentDone(assignmentId);
        return { ok: true };
      } catch (err: any) {
        const msg = err?.message || String(err);
        assignment.status = "failed";
        assignment.error = msg;
        await assignment.save();
        emitAssignmentUpdate(assignmentId, {
          status: "failed",
          progress: assignment.progress,
          error: msg,
        });
        throw err;
      }
    },
    { connection: redisConnection, concurrency: 2 },
  );

  worker.on("failed", (job, err) => {
    console.error("[worker] job failed", job?.id, err?.message);
  });
  worker.on("completed", (job) => {
    console.log("[worker] job completed", job.id);
  });

  return worker;
}

// Standalone entrypoint
if (require.main === module) {
  (async () => {
    await connectMongo();
    ensureStandaloneSocket();
    startWorker();
    console.log("[worker] standalone worker running");
  })().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
