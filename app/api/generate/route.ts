import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '@/lib/db';
import { imageGenQueue } from '@/lib/redis';
import { STYLES } from '@/lib/constants';

// Validation schema - Updated to match v2.md original styles
const generateSchema = z.object({
  inputText: z.string().min(10).max(1000),
  style: z.enum(['minimal', 'film', 'cyber', 'pastel']),
  symbols: z.array(z.string()).optional().default([]),
  mood: z.string().optional().transform((val: string | undefined) => val && val.trim() ? val : undefined),
  visibility: z.enum(['private', 'public']).optional().default('private'),
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const data = generateSchema.parse(body);

    // Validate style exists
    if (!STYLES[data.style]) {
      return NextResponse.json(
        { error: 'Invalid style' },
        { status: 400 }
      );
    }

    const projectId = uuidv4();
    const jobUuid = uuidv4();

    // Single database transaction - create project with initial status 'queued'
    const [project, job] = await prisma.$transaction([
      prisma.project.create({
        data: {
          id: projectId,
          inputText: data.inputText,
          style: data.style,
          symbols: data.symbols,
          mood: data.mood,
          visibility: data.visibility,
          status: 'queued', // Start as queued directly
          progress: 0,
        },
      }),
      prisma.job.create({
        data: {
          id: jobUuid,
          projectId: projectId,
          bullmqJobId: jobUuid, // Will be updated with actual BullMQ ID
          status: 'queued',
          progress: 0,
        },
      }),
    ]);

    // Add job to queue (non-blocking, fire and forget)
    imageGenQueue.add(
      'generate-images',
      {
        projectId: project.id,
        inputText: data.inputText,
        style: data.style,
        symbols: data.symbols,
        mood: data.mood,
      },
      {
        jobId: jobUuid,
      }
    ).catch(error => {
      console.error('Failed to add job to queue:', error);
      // Update project status to failed in background
      prisma.project.update({
        where: { id: projectId },
        data: { status: 'failed', errorMsg: 'Failed to queue job' },
      }).catch(console.error);
    });

    return NextResponse.json({
      projectId: project.id,
      jobId: job.id,
    });
  } catch (error) {
    console.error('Error in /api/generate:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
