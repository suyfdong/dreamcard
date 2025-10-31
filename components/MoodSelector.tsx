"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type Mood = "Calm" | "Lonely" | "Confused" | "Hopeful";

interface MoodSelectorProps {
  selected: Mood;
  onChange: (mood: Mood) => void;
}

const moods: Mood[] = ["Calm", "Lonely", "Confused", "Hopeful"];

export function MoodSelector({ selected, onChange }: MoodSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {moods.map((mood) => (
        <Button
          key={mood}
          variant="outline"
          onClick={() => onChange(mood)}
          className={cn(
            "transition-all duration-300",
            selected === mood
              ? "scale-105 border-2 border-rose-500/60 bg-gradient-to-br from-rose-400/20 to-pink-400/15 text-rose-200 shadow-[0_0_15px_rgba(251,113,133,0.25)] ring-1 ring-rose-400/30 hover:bg-rose-400/25 font-bold"
              : "hover:scale-105 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10"
          )}
        >
          {mood}
        </Button>
      ))}
    </div>
  );
}
