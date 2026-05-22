import { Server as HTTPServer } from 'http';
import { Server as IOServer } from 'socket.io';
import { env } from '../config/env';

let io: IOServer | null = null;

export function initSocket(server: HTTPServer) {
  io = new IOServer(server, {
    cors: { origin: env.CORS_ORIGIN, credentials: true },
  });

  io.on('connection', (socket) => {
    socket.on('subscribe', (assignmentId: string) => {
      if (typeof assignmentId === 'string' && assignmentId.length > 0) {
        socket.join(`assignment:${assignmentId}`);
      }
    });
    socket.on('unsubscribe', (assignmentId: string) => {
      socket.leave(`assignment:${assignmentId}`);
    });
  });

  console.log('[socket] initialized');
  return io;
}

export function emitAssignmentUpdate(
  assignmentId: string,
  payload: { status: string; progress: number; message?: string; error?: string }
) {
  if (!io) return;
  io.to(`assignment:${assignmentId}`).emit('assignment:update', { assignmentId, ...payload });
}

export function emitAssignmentDone(assignmentId: string) {
  if (!io) return;
  io.to(`assignment:${assignmentId}`).emit('assignment:done', { assignmentId });
}
