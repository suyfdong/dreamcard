import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId is required' },
        { status: 400 }
      );
    }

    // Get project with panels
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        panels: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Format response to match frontend expectations
    const response = {
      projectId: project.id,
      inputText: project.inputText,
      style: project.style,
      symbols: project.symbols,
      mood: project.mood,
      panels: project.panels.map((panel) => ({
        position: panel.order + 1, // Frontend expects 1-indexed
        caption: panel.caption,
        imageUrl: panel.imageUrl,
        sketchUrl: panel.sketchUrl,
      })),
      collageUrl: project.collageUrl,
      videoUrl: project.videoUrl,
      shareSlug: project.shareSlug,
      visibility: project.visibility,
      status: project.status,
      progress: project.progress,
      errorMsg: project.errorMsg,
      createdAt: project.createdAt.toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in /api/project:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
