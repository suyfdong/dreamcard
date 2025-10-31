"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type AspectRatio = "9:16" | "1:1";

interface AspectPickerProps {
  selected: AspectRatio;
  onChange: (ratio: AspectRatio) => void;
}

export function AspectPicker({ selected, onChange }: AspectPickerProps) {
  return (
    <div className="flex gap-3">
      <Button
        variant="outline"
        onClick={() => onChange("9:16")}
        className={cn(
          "flex-1 transition-all duration-300",
          selected === "9:16"
            ? "scale-105 border-2 border-amber-500/60 bg-gradient-to-br from-amber-400/20 to-orange-400/15 text-amber-200 shadow-[0_0_15px_rgba(251,191,36,0.25)] ring-1 ring-amber-400/30 hover:bg-amber-400/25"
            : "hover:scale-105 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10"
        )}
      >
        <div className="flex items-center gap-2">
          <div className={cn(
            "h-6 w-4 rounded border-2 border-current transition-all",
            selected === "9:16" && "shadow-[0_0_8px_rgba(251,191,36,0.4)]"
          )} />
          <span className={cn(selected === "9:16" && "font-bold")}>9:16</span>
        </div>
      </Button>
      <Button
        variant="outline"
        onClick={() => onChange("1:1")}
        className={cn(
          "flex-1 transition-all duration-300",
          selected === "1:1"
            ? "scale-105 border-2 border-amber-500/60 bg-gradient-to-br from-amber-400/20 to-orange-400/15 text-amber-200 shadow-[0_0_15px_rgba(251,191,36,0.25)] ring-1 ring-amber-400/30 hover:bg-amber-400/25"
            : "hover:scale-105 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10"
        )}
      >
        <div className="flex items-center gap-2">
          <div className={cn(
            "h-5 w-5 rounded border-2 border-current transition-all",
            selected === "1:1" && "shadow-[0_0_8px_rgba(251,191,36,0.4)]"
          )} />
          <span className={cn(selected === "1:1" && "font-bold")}>1:1</span>
        </div>
      </Button>
    </div>
  );
}
