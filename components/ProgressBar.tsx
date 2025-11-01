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

  useEffect(() => {
    // Start from 0 and smoothly animate to target progress
    let currentProgress = displayProgress;
    const targetProgress = progress;

    // If target is less than current (shouldn't happen often), jump to it
    if (targetProgress < currentProgress) {
      setDisplayProgress(targetProgress);
      return;
    }

    // Smooth increment animation
    const interval = setInterval(() => {
      if (currentProgress < targetProgress) {
        // Increment by small steps for smooth animation
        const increment = Math.max(0.5, (targetProgress - currentProgress) / 20);
        currentProgress = Math.min(currentProgress + increment, targetProgress);
        setDisplayProgress(Math.floor(currentProgress));
      } else {
        clearInterval(interval);
      }
    }, 100); // Update every 100ms

    return () => clearInterval(interval);
  }, [progress, displayProgress]);

  // Add subtle "fake" progress when stuck at same value for too long
  useEffect(() => {
    if (displayProgress >= 95) return; // Don't fake progress near completion

    const fakeProgressTimer = setInterval(() => {
      setDisplayProgress((prev) => {
        // Add tiny increments (0.1-0.3%) to show "activity"
        const fakeIncrement = Math.random() * 0.3 + 0.1;
        const newProgress = prev + fakeIncrement;
        // Don't exceed the real progress value
        return Math.min(newProgress, progress, 95);
      });
    }, 800); // Every 800ms add tiny bit

    return () => clearInterval(fakeProgressTimer);
  }, [displayProgress, progress]);

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
                    ? "border-primary bg-primary/20 text-primary animate-pulse"
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
          {displayProgress.toFixed(1)}%
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
