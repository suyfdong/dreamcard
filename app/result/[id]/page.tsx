"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ProgressBar";
import { PanelGrid } from "@/components/PanelGrid";
import { ShareButtons } from "@/components/ShareButtons";
import { Toaster } from "@/components/ui/toaster";
import { apiClient } from "@/lib/api-client";
import type { ProjectResponse } from "@/lib/api-client";

interface Stage {
  name: string;
  label: string;
  startTime: number;
  duration: number;
  completed: boolean;
}

// Map progress (0-1) to stages
function progressToStages(progress: number): Stage[] {
  return [
    {
      name: "parsing",
      label: "Parsing",
      startTime: 0,
      duration: 2000,
      completed: progress >= 0.1,
    },
    {
      name: "sketching",
      label: "Sketching",
      startTime: 2000,
      duration: 8000,
      completed: progress >= 0.35,
    },
    {
      name: "rendering",
      label: "Rendering",
      startTime: 10000,
      duration: 30000,
      completed: progress >= 0.8,
    },
    {
      name: "collaging",
      label: "Collaging",
      startTime: 40000,
      duration: 10000,
      completed: progress >= 1.0,
    },
  ];
}

function getCurrentStage(progress: number): string {
  if (progress < 0.1) return "parsing";
  if (progress < 0.35) return "sketching";
  if (progress < 0.8) return "rendering";
  return "collaging";
}

export default function ResultPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState("parsing");
  const [stages, setStages] = useState<Stage[]>(progressToStages(0));
  const [project, setProject] = useState<ProjectResponse | null>(null);
  const [isPrivate, setIsPrivate] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    // Get jobId from sessionStorage
    const jobId = sessionStorage.getItem('currentJobId');

    if (!jobId) {
      // If no jobId, try to load project directly (in case page was refreshed)
      loadProject();
      return;
    }

    // Poll for status updates
    let cancelled = false;

    const pollStatus = async () => {
      try {
        const status = await apiClient.getStatus(jobId);

        if (cancelled) return;

        // Update progress
        setProgress(Math.round(status.progress * 100));
        setCurrentStage(getCurrentStage(status.progress));
        setStages(progressToStages(status.progress));

        if (status.status === 'success') {
          setIsComplete(true);
          await loadProject();
          sessionStorage.removeItem('currentJobId');
        } else if (status.status === 'failed') {
          setError(status.error || 'Generation failed');
          sessionStorage.removeItem('currentJobId');
        } else {
          // Continue polling
          setTimeout(pollStatus, 2000);
        }
      } catch (err) {
        console.error('Error polling status:', err);
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load status');
        }
      }
    };

    pollStatus();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const loadProject = async () => {
    try {
      const projectData = await apiClient.getProject(projectId);
      setProject(projectData);
      setIsPrivate(projectData.visibility === 'private');

      // Update progress based on project status
      if (projectData.status === 'success') {
        setProgress(100);
        setIsComplete(true);
        setStages(progressToStages(1.0));
      } else {
        setProgress(Math.round(projectData.progress * 100));
        setStages(progressToStages(projectData.progress));
        setCurrentStage(getCurrentStage(projectData.progress));
      }
    } catch (err) {
      console.error('Error loading project:', err);
      setError(err instanceof Error ? err.message : 'Failed to load project');
    }
  };

  if (error) {
    return (
      <div className="min-h-screen p-4 sm:p-6 md:p-8">
        <div className="mx-auto max-w-6xl">
          <Card className="rounded-2xl p-6">
            <h2 className="mb-4 text-lg font-semibold text-red-500">Error</h2>
            <p className="text-muted-foreground">{error}</p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 text-center">
          <h1 className="mb-2 bg-gradient-to-r from-[#6E67FF] to-[#00D4FF] bg-clip-text text-3xl font-bold text-transparent">
            {isComplete ? 'Your Dream is Ready!' : 'Creating Your Dream'}
          </h1>
          <p className="text-muted-foreground">
            {isComplete
              ? 'Your unique dream card has been created'
              : 'Please wait while we craft your unique dream card'}
          </p>
        </div>

        <div className="space-y-6">
          {!isComplete && (
            <Card className="rounded-2xl p-6">
              <ProgressBar stages={stages} currentStage={currentStage} progress={progress} />
            </Card>
          )}

          {project && project.panels && project.panels.length > 0 && (
            <Card className="rounded-2xl p-6">
              <h2 className="mb-4 text-lg font-semibold">Dream Card Preview</h2>
              <PanelGrid
                panels={project.panels.map(p => ({
                  position: p.position,
                  sketchUrl: p.sketchUrl || '',
                  imageUrl: p.imageUrl || '',
                  text: p.caption,
                }))}
                aspectRatio="9:16"
              />
            </Card>
          )}

          {isComplete && project && (
            <Card className="rounded-2xl p-6">
              <h2 className="mb-4 text-lg font-semibold">Export & Share</h2>
              <ShareButtons
                aspectRatio="9:16"
                isPrivate={isPrivate}
                onPrivacyToggle={() => setIsPrivate(!isPrivate)}
                panels={project.panels.map(p => ({
                  imageUrl: p.imageUrl || '',
                  caption: p.caption
                }))}
                projectId={projectId}
              />
            </Card>
          )}
        </div>
      </div>
      <Toaster />
    </div>
  );
}
