"use client";

import { cn } from "@/lib/utils";

interface Stage {
  name: string;
  label: string;
  completed: boolean;
}

interface ProgressBarProps {
  stages: Stage[];
  currentStage: string;
  progress: number;
}

export function ProgressBar({ stages, currentStage, progress }: ProgressBarProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        {stages.map((stage, index) => {
          const isCurrent = stage.name === currentStage;
          const isCompleted = stage.completed;

          return (
            <div key={stage.name} className="flex-1 text-center">
              <div
                className={cn(
                  "mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300",
                  isCompleted
                    ? "border-primary bg-primary text-primary-foreground"
                    : isCurrent
                    ? "border-primary bg-primary/20 text-primary"
                    : "border-muted-foreground/30 text-muted-foreground"
                )}
              >
                {index + 1}
              </div>
              <p
                className={cn(
                  "text-xs transition-colors duration-300",
                  isCompleted || isCurrent ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {stage.label}
              </p>
            </div>
          );
        })}
      </div>

      <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <p className="text-center text-sm text-muted-foreground">{progress}% Complete</p>
    </div>
  );
}
