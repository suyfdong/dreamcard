"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Updated to match v2.md original style system
export type DreamStyle = "minimal" | "film" | "cyber" | "pastel";

interface DreamStyleCardProps {
  style: DreamStyle;
  selected: boolean;
  onClick: () => void;
}

const styleConfig = {
  minimal: {
    title: "Minimal Sketch",
    description: "Clean line art",
    // Using original Memory Dream image
    imageUrl: "https://images.pexels.com/photos/1209843/pexels-photo-1209843.jpeg?auto=compress&cs=tinysrgb&w=800",
    gradient: "from-amber-500/70 via-orange-500/50 to-transparent",
    bgColor: "from-orange-600/30",
  },
  film: {
    title: "Film Grain",
    description: "Vintage cinematic",
    // Using original Surreal Dream image
    imageUrl: "https://images.pexels.com/photos/1616403/pexels-photo-1616403.jpeg?auto=compress&cs=tinysrgb&w=800",
    gradient: "from-slate-500/70 via-gray-600/50 to-transparent",
    bgColor: "from-slate-700/30",
  },
  cyber: {
    title: "Cyber Mist",
    description: "Neon cyberpunk",
    // Using original Lucid Dream image
    imageUrl: "https://replicate.delivery/xezq/tjZXUEFBevVDJaAgtyIoqMRwdB6Rm7WqnkCQ1wvFIzjQHejVA/out-0.webp",
    gradient: "from-cyan-500/70 via-blue-600/50 to-transparent",
    bgColor: "from-cyan-600/30",
  },
  pastel: {
    title: "Pastel Fairytale",
    description: "Soft and dreamy",
    // Using original Fantasy Dream image
    imageUrl: "https://replicate.delivery/xezq/KskDYLE5M2rFJteUuph9J741X8HJpdyYGVFxftT1w9doB8jVA/out-0.webp",
    gradient: "from-pink-500/70 via-purple-600/50 to-transparent",
    bgColor: "from-pink-600/30",
  },
};

export function DreamStyleCard({ style, selected, onClick }: DreamStyleCardProps) {
  const config = styleConfig[style];

  return (
    <Card
      onClick={onClick}
      className={cn(
        "group relative h-48 cursor-pointer overflow-hidden border-2 transition-all duration-500",
        selected
          ? "scale-110 border-primary shadow-[0_0_40px_rgba(110,103,255,0.6)] ring-4 ring-primary/30"
          : "border-border/50 hover:scale-105 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/20"
      )}
    >
      <img
        src={config.imageUrl}
        alt={config.title}
        className={cn(
          "absolute inset-0 h-full w-full object-cover transition-all duration-700",
          selected ? "scale-110 brightness-110" : "group-hover:scale-110"
        )}
      />

      <div className={cn(
        "absolute inset-0 bg-gradient-to-t transition-opacity duration-500",
        config.gradient,
        selected ? "opacity-80" : "opacity-70 group-hover:opacity-85"
      )} />

      <div className={cn(
        "absolute inset-0 transition-opacity duration-500",
        selected ? "bg-black/20" : "bg-black/40 group-hover:bg-black/20"
      )} />

      {selected && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-primary/20 via-transparent to-cyan-500/20" />
      )}

      <div className="relative flex h-full flex-col items-center justify-end p-6">
        <h3 className={cn(
          "mb-2 text-xl font-bold text-white drop-shadow-lg transition-all duration-300",
          selected && "scale-110 text-2xl"
        )}>
          {config.title}
        </h3>
        <p className="text-center text-sm text-white/90 drop-shadow-md">{config.description}</p>
      </div>

      {selected && (
        <div className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-cyan-500 shadow-[0_0_20px_rgba(110,103,255,0.8)] animate-pulse">
          <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      )}
    </Card>
  );
}
