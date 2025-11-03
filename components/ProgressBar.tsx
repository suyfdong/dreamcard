"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

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
  // Smooth animated progress (always increasing for better UX)
  const [displayProgress, setDisplayProgress] = useState(0);

  // Single effect to handle both real progress updates and fake increments
  useEffect(() => {
    // Update every 300ms for smooth animation
    const interval = setInterval(() => {
      setDisplayProgress((prev) => {
        // If we're close to completion, just show 100%
        if (progress >= 100) {
          return 100;
        }

        // If real progress is higher than display, move toward it faster
        if (progress > prev) {
          const diff = progress - prev;
          const increment = Math.max(0.5, diff / 10); // Catch up speed
          return Math.min(prev + increment, progress, 100);
        }

        // Otherwise add fake tiny increments to show "activity"
        // Keep moving slowly even when backend is stuck
        if (prev < 95) {
          const fakeIncrement = Math.random() * 0.4 + 0.2; // 0.2-0.6% per tick
          return Math.min(prev + fakeIncrement, 95); // Cap at 95% for fake progress
        }

        // If we're at 95% and waiting for backend, just stay there
        return prev;
      });
    }, 300); // Update every 300ms

    return () => clearInterval(interval);
  }, [progress]); // Only depend on real progress from backend

  return (
    <div className="space-y-6">
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
                  isCompleted || isCurrent ? "text-foreground font-medium" : "text-muted-foreground"
                )}
              >
                {stage.label}
              </p>
            </div>
          );
        })}
      </div>

      {/* Wider, more prominent progress bar */}
      <div className="relative h-4 w-full overflow-hidden rounded-full bg-secondary shadow-inner">
        <div
          className="h-full bg-gradient-to-r from-[#6E67FF] to-[#00D4FF] transition-all duration-500 ease-out relative overflow-hidden"
          style={{ width: `${displayProgress}%` }}
        >
          {/* Animated shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
        </div>
      </div>

      <div className="text-center space-y-1">
        <p className="text-2xl font-bold bg-gradient-to-r from-[#6E67FF] to-[#00D4FF] bg-clip-text text-transparent">
          {Math.floor(displayProgress)}%
        </p>
        <p className="text-sm text-muted-foreground">
          {displayProgress < 10 ? 'Interpreting your dream...' :
           displayProgress < 35 ? 'Crafting visual metaphors...' :
           displayProgress < 80 ? 'Generating dream imagery...' :
           displayProgress < 100 ? 'Finalizing your dream card...' :
           'Complete!'}
        </p>
      </div>
    </div>
  );
}
