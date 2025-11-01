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

// Lazy initialization to avoid connecting during build time
let _connection: Redis | null = null;
let _imageGenQueue: Queue<ImageGenJobData> | null = null;

// Get or create Redis connection
function getConnection(): Redis {
  if (isBuildTime) {
    // Return a mock connection during build time
    return {} as Redis;
  }

  if (_connection) {
    return _connection;
  }

  const redisUrl = process.env.UPSTASH_REDIS_URL;

  if (!redisUrl) {
    throw new Error('UPSTASH_REDIS_URL environment variable is required');
  }

  _connection = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    // Remove family: 6 to allow automatic IPv4/IPv6 detection
    // Railway environment may not support IPv6 DNS resolution
    tls: {
      rejectUnauthorized: false,
    },
  });

  return _connection;
}

// Get or create queue
function getQueue(): Queue<ImageGenJobData> {
  if (isBuildTime) {
    // Return a mock queue during build time
    return {} as Queue<ImageGenJobData>;
  }

  if (_imageGenQueue) {
    return _imageGenQueue;
  }

  _imageGenQueue = new Queue<ImageGenJobData>('image-generation', {
    connection: getConnection(),
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

  return _imageGenQueue;
}

// Export lazy-loaded instances
export const connection = new Proxy({} as Redis, {
  get(_target, prop) {
    return getConnection()[prop as keyof Redis];
  },
});

export const imageGenQueue = new Proxy({} as Queue<ImageGenJobData>, {
  get(_target, prop) {
    return getQueue()[prop as keyof Queue<ImageGenJobData>];
  },
});
