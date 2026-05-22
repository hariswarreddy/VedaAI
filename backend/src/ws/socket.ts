import { Server as HTTPServer } from "http";
import { Server as IOServer } from "socket.io";
import { env } from "../config/env";

let io: IOServer | null = null;

export function initSocket(server: HTTPServer) {
  const origins = env.CORS_ORIGIN.split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  io = new IOServer(server, {
    cors: {
      origin: origins.includes("*") ? true : origins,
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    socket.on("subscribe", (assignmentId: string) => {
      if (typeof assignmentId === "string" && assignmentId.length > 0) {
        socket.join(`assignment:${assignmentId}`);
      }
    });
    socket.on("unsubscribe", (assignmentId: string) => {
      socket.leave(`assignment:${assignmentId}`);
    });
  });

  console.log("[socket] initialized");
  return io;
}

export function emitAssignmentUpdate(
  assignmentId: string,
  payload: {
    status: string;
    progress: number;
    message?: string;
    error?: string;
  },
) {
  if (!io) return;
  io.to(`assignment:${assignmentId}`).emit("assignment:update", {
    assignmentId,
    ...payload,
  });
}

export function emitAssignmentDone(assignmentId: string) {
  if (!io) return;
  io.to(`assignment:${assignmentId}`).emit("assignment:done", { assignmentId });
}
