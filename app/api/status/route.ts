import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { imageGenQueue } from '@/lib/redis';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json(
        { error: 'jobId is required' },
        { status: 400 }
      );
    }

    // Get job info from database
    const jobRecord = await prisma.job.findUnique({
      where: { bullmqJobId: jobId },
    });

    if (!jobRecord) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Get project info
    const project = await prisma.project.findUnique({
      where: { id: jobRecord.projectId },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Get job status from BullMQ
    const job = await imageGenQueue.getJob(jobId);

    let status = project.status;
    let progress = project.progress;
    let error = null;

    if (job) {
      const jobState = await job.getState();
      const jobProgress = job.progress;

      // Map BullMQ states to our status
      if (jobState === 'waiting' || jobState === 'delayed') {
        status = 'queued';
      } else if (jobState === 'active') {
        status = 'running';
        if (typeof jobProgress === 'number') {
          progress = jobProgress / 100; // BullMQ uses 0-100, we use 0-1
        }
      } else if (jobState === 'completed') {
        status = 'success';
        progress = 1.0;
      } else if (jobState === 'failed') {
        status = 'failed';
        error = job.failedReason || 'Unknown error';
      }
    }

    return NextResponse.json({
      status,
      progress,
      projectId: project.id,
      error,
    });
  } catch (error) {
    console.error('Error in /api/status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
