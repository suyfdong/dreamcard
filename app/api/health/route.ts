import { NextResponse } from 'next/server';

export async function GET() {
  const deployTime = new Date().toISOString();
  const version = process.env.VERCEL_GIT_COMMIT_SHA?.substring(0, 7) || 'local';

  return NextResponse.json({
    status: 'ok',
    version,
    deployTime,
    timestamp: Date.now(),
    // 添加一个固定的版本号来追踪
    buildVersion: '2025-01-31-v3', // Updated with Redis fix + Webhook test
    redis: {
      url: process.env.UPSTASH_REDIS_URL ? 'configured' : 'missing',
    },
    database: {
      url: process.env.DATABASE_URL ? 'configured' : 'missing',
    },
    ai: {
      openrouter: process.env.OPENROUTER_API_KEY ? 'configured' : 'missing',
      replicate: process.env.REPLICATE_API_TOKEN ? 'configured' : 'missing',
    },
  });
}
