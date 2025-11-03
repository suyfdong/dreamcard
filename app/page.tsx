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

  const handleGenerate = () => {
    const trimmedText = dreamText.trim();

    console.log('Generate clicked, dreamText:', dreamText, 'trimmed:', trimmedText);

    // Validate input before submitting
    if (!trimmedText) {
      console.log('Validation failed: empty text');
      toast({
        title: "Dream description required",
        description: "Please describe your dream first",
        variant: "destructive",
      });
      return;
    }

    if (trimmedText.length < 10) {
      console.log('Validation failed: too short', trimmedText.length);
      toast({
        title: "Description too short",
        description: `Please provide at least 10 characters (you have ${trimmedText.length})`,
        variant: "destructive",
      });
      return;
    }

    console.log('Validation passed, starting generation...');
    setIsGenerating(true);

    // Convert symbols to lowercase for backend
    const symbols = selectedSymbols.map((s: string) => s.toLowerCase());

    // Generate a temporary projectId for immediate navigation
    const tempProjectId = `temp-${Date.now()}`;

    console.log('Navigating to:', `/result/${tempProjectId}`);

    // Navigate IMMEDIATELY (no waiting!)
    router.push(`/result/${tempProjectId}`);

    // Call API in background (fire and forget)
    apiClient.generate({
      inputText: trimmedText,
      style,
      symbols,
      mood: mood ? mood.toLowerCase() : undefined, // Only send mood if it exists
      visibility: 'private',
    }).then(response => {
      // Store both IDs for result page to use
      sessionStorage.setItem('currentJobId', response.jobId);
      sessionStorage.setItem('actualProjectId', response.projectId);
      sessionStorage.setItem('tempProjectId', tempProjectId);
    }).catch(error => {
      console.error('Error generating dream card:', error);
      // Store error for result page to show
      const errorMessage = error instanceof Error ? error.message : 'Failed to start generation';
      sessionStorage.setItem('generateError', errorMessage);

      // Also show toast if still on page
      toast({
        title: "Generation failed",
        description: errorMessage,
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
            disabled={dreamText.trim().length < 10 || isGenerating}
            className="gradient-brand h-12 w-full rounded-xl text-base font-semibold shadow-lg shadow-primary/20 transition-all hover:scale-105 hover:shadow-xl hover:shadow-primary/30"
            title={dreamText.trim().length < 10 ? `请输入至少10个字符（当前${dreamText.trim().length}个）` : isGenerating ? "正在生成中..." : "点击生成梦境卡片"}
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

          {/* Debug info - remove later */}
          <div className="mt-2 text-xs text-muted-foreground text-center">
            Debug: dreamText length = {dreamText.length}, trimmed = {dreamText.trim().length}, isGenerating = {isGenerating.toString()}
          </div>
        </div>
        </div>
      </div>
    </>
  );
}
