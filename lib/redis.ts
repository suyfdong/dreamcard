import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { env } from './env';

// Create Redis connection for BullMQ
export const connection = new Redis(env.UPSTASH_REDIS_REST_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

// Define job data interface
export interface ImageGenJobData {
  projectId: string;
  inputText: string;
  style: string;
  symbols: string[];
  mood?: string;
}

// Create queue
export const imageGenQueue = new Queue<ImageGenJobData>('image-generation', {
  connection,
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: {
      age: 3600, // keep completed jobs for 1 hour
      count: 100,
    },
    removeOnFail: {
      age: 7200, // keep failed jobs for 2 hours
    },
  },
});
