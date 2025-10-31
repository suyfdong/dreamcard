import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { env } from './env';

// Create Redis connection for BullMQ
// Use UPSTASH_REDIS_URL (redis:// protocol) for ioredis
const redisUrl = process.env.UPSTASH_REDIS_URL;

if (!redisUrl) {
  throw new Error('UPSTASH_REDIS_URL environment variable is required');
}

export const connection = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  family: 6, // Use IPv6
  tls: {
    rejectUnauthorized: false,
  },
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
