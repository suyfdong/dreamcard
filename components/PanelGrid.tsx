"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Panel {
  position: number;
  sketchUrl: string;
  imageUrl: string;
  text: string;
}

interface PanelGridProps {
  panels: Panel[];
  aspectRatio: "9:16" | "1:1";
  onTextChange?: (position: number, text: string) => void;
}

export function PanelGrid({ panels, aspectRatio, onTextChange }: PanelGridProps) {
  const [panelTexts, setPanelTexts] = useState<Record<number, string>>({});
  const [showFinal, setShowFinal] = useState(false);

  useEffect(() => {
    const initialTexts: Record<number, string> = {};
    panels.forEach((panel) => {
      initialTexts[panel.position] = panel.text;
    });
    setPanelTexts(initialTexts);

    const timer = setTimeout(() => {
      setShowFinal(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, [panels]);

  const handleTextChange = (position: number, text: string) => {
    setPanelTexts((prev) => ({ ...prev, [position]: text }));
    onTextChange?.(position, text);
  };

  const isVertical = aspectRatio === "9:16";

  return (
    <div className="space-y-4">
      {/* 三张图横向排列，适配不同屏幕 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {panels.map((panel) => (
          <div key={panel.position} className="space-y-3">
            <Card className="overflow-hidden rounded-2xl">
              {/* 固定合理的高度，保持 9:16 比例 */}
              <div className="relative aspect-[9/16] max-h-[500px]">
                <img
                  src={showFinal ? panel.imageUrl : panel.sketchUrl}
                  alt={`Panel ${panel.position}`}
                  className={cn(
                    "h-full w-full object-cover transition-opacity duration-1000",
                    showFinal ? "opacity-100" : "opacity-70"
                  )}
                />
              </div>
            </Card>
            <Input
              value={panelTexts[panel.position] || ""}
              onChange={(e) => handleTextChange(panel.position, e.target.value)}
              placeholder="Add your caption..."
              className="rounded-xl text-center text-sm"
              maxLength={40}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
