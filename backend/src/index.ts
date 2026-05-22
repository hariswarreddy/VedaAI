import express from 'express';
import cors from 'cors';
import http from 'http';
import { env } from './config/env';
import { connectMongo } from './db/mongo';
import { assignmentsRouter } from './routes/assignments';
import { initSocket } from './ws/socket';
import { startWorker } from './queue/worker';

async function main() {
  await connectMongo();

  const app = express();
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
  app.use(express.json({ limit: '2mb' }));

  app.get('/health', (_req, res) => res.json({ ok: true }));
  app.use('/api/assignments', assignmentsRouter);

  const server = http.createServer(app);
  initSocket(server);

  // Start the worker in-process for a simple dev experience.
  // For production, run the worker separately via `npm run worker`.
  if (process.env.IN_PROCESS_WORKER !== 'false') {
    startWorker();
    console.log('[server] in-process worker started');
  }

  server.listen(env.PORT, () => {
    console.log(`[server] listening on http://localhost:${env.PORT}`);
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
