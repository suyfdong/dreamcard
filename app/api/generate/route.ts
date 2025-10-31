import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '@/lib/db';
import { imageGenQueue } from '@/lib/redis';
import { STYLES } from '@/lib/constants';

// Validation schema
const generateSchema = z.object({
  inputText: z.string().min(10).max(1000),
  style: z.enum(['memory', 'surreal', 'lucid', 'fantasy']),
  symbols: z.array(z.string()).optional().default([]),
  mood: z.string().optional(),
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

    // Create project in database
    const project = await prisma.project.create({
      data: {
        id: uuidv4(),
        inputText: data.inputText,
        style: data.style,
        symbols: data.symbols,
        mood: data.mood,
        visibility: data.visibility,
        status: 'pending',
        progress: 0,
      },
    });

    // Add job to queue
    const job = await imageGenQueue.add(
      'generate-images',
      {
        projectId: project.id,
        inputText: data.inputText,
        style: data.style,
        symbols: data.symbols,
        mood: data.mood,
      },
      {
        jobId: uuidv4(),
      }
    );

    // Save job info
    await prisma.job.create({
      data: {
        id: uuidv4(),
        projectId: project.id,
        bullmqJobId: job.id!,
        status: 'queued',
        progress: 0,
      },
    });

    // Update project status
    await prisma.project.update({
      where: { id: project.id },
      data: { status: 'queued' },
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
