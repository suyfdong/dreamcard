import { Queue } from 'bullmq';
import Redis from 'ioredis';

// Define job data interface
export interface ImageGenJobData {
  projectId: string;
  inputText: string;
  style: string;
  symbols: string[];
  mood?: string;
}

// Check if we're in build time (skip Redis connection during build)
const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build';

// Create Redis connection (only once, not lazily)
function createConnection(): Redis | null {
  if (isBuildTime) {
    return null;
  }

  const redisUrl = process.env.UPSTASH_REDIS_URL;

  if (!redisUrl) {
    throw new Error('UPSTASH_REDIS_URL environment variable is required');
  }

  return new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });
}

// Create connection immediately (not lazy)
export const connection = createConnection();

// Create queue
export const imageGenQueue = connection
  ? new Queue<ImageGenJobData>('image-generation', {
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
    })
  : (null as any); // Build time mock
