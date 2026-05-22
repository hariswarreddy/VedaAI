import { Queue, QueueEvents } from 'bullmq';
import { redisConnection } from '../db/redis';

export const GENERATION_QUEUE = 'assignment-generation';

export const generationQueue = new Queue(GENERATION_QUEUE, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: 'exponential', delay: 3000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 100 },
  },
});

export const generationQueueEvents = new QueueEvents(GENERATION_QUEUE, {
  connection: redisConnection,
});
