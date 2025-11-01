"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { DreamStyleCard, DreamStyle } from "@/components/DreamStyleCard";
import { AspectPicker, AspectRatio } from "@/components/AspectPicker";
import { SymbolChips } from "@/components/SymbolChips";
import { MoodSelector, Mood } from "@/components/MoodSelector";
import { DreamBackground } from "@/components/DreamBackground";
import { Sparkles, Loader2 } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";

const availableSymbols = ["Stairs", "Mirror", "Door", "Ocean", "Cat", "Clock", "Window", "Fog"];

export default function Home() {
  const router = useRouter();
  const { toast } = useToast();
  const [dreamText, setDreamText] = useState("");
  const [style, setStyle] = useState<DreamStyle>("film"); // Default to film (v2.md spec)
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("9:16");
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>([]);
  const [mood, setMood] = useState<Mood>("Calm");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!dreamText.trim()) return;

    setIsGenerating(true);

    // Convert symbols to lowercase for backend
    const symbols = selectedSymbols.map(s => s.toLowerCase());

    // Start API call but DON'T wait for it - navigate immediately
    apiClient.generate({
      inputText: dreamText,
      style,
      symbols,
      mood: mood.toLowerCase(),
      visibility: 'private',
    }).then(response => {
      // Store jobId in sessionStorage for polling
      sessionStorage.setItem('currentJobId', response.jobId);

      // Navigate immediately to result page (don't wait for generation)
      router.push(`/result/${response.projectId}`);
    }).catch(error => {
      console.error('Error generating dream card:', error);
      setIsGenerating(false);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate dream card. Please try again.",
        variant: "destructive",
      });
    });
  };

  return (
    <>
      <DreamBackground />
      <div className="relative z-10 min-h-screen p-4 sm:p-6 md:p-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 text-center">
            <h1 className="font-dream mb-3 bg-gradient-to-r from-[#6E67FF] via-[#8B7FFF] to-[#00D4FF] bg-clip-text text-5xl font-bold text-transparent sm:text-6xl md:text-7xl" style={{ transform: 'scaleY(1.4)', letterSpacing: '0.05em', transformOrigin: 'center' }}>
              DreamCard
            </h1>
            <p className="font-ethereal text-xl italic text-muted-foreground/90 sm:text-2xl">
              Transform your dreams into art
            </p>
          </div>

        <div className="space-y-6">
          <Card className="rounded-2xl p-6">
            <label className="mb-2 block text-base font-semibold tracking-wide text-foreground/90 uppercase" style={{ letterSpacing: '0.08em' }}>Describe Your Dream</label>
            <Textarea
              placeholder="I was in an ancient library with towering bookshelves..."
              value={dreamText}
              onChange={(e) => setDreamText(e.target.value)}
              className="min-h-32 resize-none rounded-xl"
            />
          </Card>

          <Card className="rounded-2xl p-6">
            <label className="mb-4 block text-base font-semibold tracking-wide text-foreground/90 uppercase" style={{ letterSpacing: '0.08em' }}>Dream Style</label>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {(["minimal", "film", "cyber", "pastel"] as DreamStyle[]).map((s) => (
                <DreamStyleCard
                  key={s}
                  style={s}
                  selected={style === s}
                  onClick={() => setStyle(s)}
                />
              ))}
            </div>
          </Card>

          <Card className="rounded-2xl p-6">
            <label className="mb-4 block text-base font-semibold tracking-wide text-foreground/90 uppercase" style={{ letterSpacing: '0.08em' }}>Aspect Ratio</label>
            <AspectPicker selected={aspectRatio} onChange={setAspectRatio} />
          </Card>

          <Card className="rounded-2xl p-6">
            <label className="mb-4 block text-base font-semibold tracking-wide text-foreground/90 uppercase" style={{ letterSpacing: '0.08em' }}>Symbolic Elements</label>
            <SymbolChips
              symbols={availableSymbols}
              selected={selectedSymbols}
              onChange={setSelectedSymbols}
            />
          </Card>

          <Card className="rounded-2xl p-6">
            <label className="mb-4 block text-base font-semibold tracking-wide text-foreground/90 uppercase" style={{ letterSpacing: '0.08em' }}>Mood</label>
            <MoodSelector selected={mood} onChange={setMood} />
          </Card>

          <Button
            onClick={handleGenerate}
            disabled={!dreamText.trim() || isGenerating}
            className="gradient-brand h-12 w-full rounded-xl text-base font-semibold shadow-lg shadow-primary/20 transition-all hover:scale-105 hover:shadow-xl hover:shadow-primary/30"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Creating Your Dream...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                Generate Dream Card
              </>
            )}
          </Button>
        </div>
        </div>
      </div>
    </>
  );
}
