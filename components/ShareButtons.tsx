"use client";

import { Button } from "@/components/ui/button";
import { Download, Share2, Home, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

interface ShareButtonsProps {
  aspectRatio: "9:16" | "1:1";
  isPrivate: boolean;
  onPrivacyToggle: () => void;
  panels?: Array<{ imageUrl: string; caption: string }>;
  projectId?: string;
}

export function ShareButtons({ isPrivate, onPrivacyToggle, panels, projectId }: ShareButtonsProps) {
  const { toast } = useToast();
  const router = useRouter();

  const handleDownload = async (ratio: "9:16" | "1:1") => {
    if (!panels || panels.length === 0) {
      toast({
        title: "Error",
        description: "No images available to download",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create canvas for comic-style collage
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas not supported');

      // 加载并绘制所有图片
      const loadImage = (url: string): Promise<HTMLImageElement> => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = url;
        });
      };

      toast({
        title: "Preparing Download",
        description: "Compositing your dream card...",
      });

      // Load all images first
      const images = await Promise.all(panels.map(p => loadImage(p.imageUrl)));

      if (ratio === "9:16") {
        // COMIC-STYLE MANGA LAYOUT for 9:16
        // Final size: 1080 x 1920 (Instagram story / TikTok format)
        canvas.width = 1080;
        canvas.height = 1920;

        // Fill background with subtle gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, 1920);
        gradient.addColorStop(0, '#0a0a0a');
        gradient.addColorStop(1, '#1a1a1a');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 1080, 1920);

        // Panel layout (manga-style irregular arrangement):
        // Panel 1: Large top panel (beginning) - 1040x600
        // Panel 2: Medium middle-left (development) - 500x550
        // Panel 3: Large bottom-right (climax) - 560x730

        const gap = 20; // Gap between panels
        const padding = 20; // Edge padding

        // Panel 1 (Beginning) - Wide establishing shot at top
        const p1X = padding;
        const p1Y = padding;
        const p1W = 1080 - (padding * 2);
        const p1H = 600;

        // Draw panel 1 with border
        ctx.fillStyle = '#000000';
        ctx.fillRect(p1X - 3, p1Y - 3, p1W + 6, p1H + 6);
        ctx.drawImage(images[0], p1X, p1Y, p1W, p1H);

        // Panel 2 (Development) - Left panel
        const p2X = padding;
        const p2Y = p1Y + p1H + gap;
        const p2W = 500;
        const p2H = 1920 - p2Y - padding;

        ctx.fillStyle = '#000000';
        ctx.fillRect(p2X - 3, p2Y - 3, p2W + 6, p2H + 6);
        ctx.drawImage(images[1], p2X, p2Y, p2W, p2H);

        // Panel 3 (Climax) - Right panel (larger, emphasizes conclusion)
        const p3X = p2X + p2W + gap;
        const p3Y = p2Y;
        const p3W = 1080 - p3X - padding;
        const p3H = p2H;

        ctx.fillStyle = '#000000';
        ctx.fillRect(p3X - 3, p3Y - 3, p3W + 6, p3H + 6);
        ctx.drawImage(images[2], p3X, p3Y, p3W, p3H);

        // Add subtle white border to entire composition
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 2;
        ctx.strokeRect(1, 1, 1078, 1918);

      } else {
        // 1:1 = 正方形 (Instagram post format)
        // Final size: 1080 x 1080
        canvas.width = 1080;
        canvas.height = 1080;

        // Fill background
        const gradient = ctx.createLinearGradient(0, 0, 0, 1080);
        gradient.addColorStop(0, '#0a0a0a');
        gradient.addColorStop(1, '#1a1a1a');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 1080, 1080);

        // Three panels arranged artistically in square format
        const gap = 15;
        const padding = 20;

        // Panel 1: Top-left large
        const p1W = 650;
        const p1H = 520;
        ctx.fillStyle = '#000000';
        ctx.fillRect(padding - 3, padding - 3, p1W + 6, p1H + 6);
        ctx.drawImage(images[0], padding, padding, p1W, p1H);

        // Panel 2: Top-right
        const p2X = padding + p1W + gap;
        const p2W = 1080 - p2X - padding;
        const p2H = 520;
        ctx.fillStyle = '#000000';
        ctx.fillRect(p2X - 3, padding - 3, p2W + 6, p2H + 6);
        ctx.drawImage(images[1], p2X, padding, p2W, p2H);

        // Panel 3: Full width bottom
        const p3Y = padding + p1H + gap;
        const p3W = 1080 - (padding * 2);
        const p3H = 1080 - p3Y - padding;
        ctx.fillStyle = '#000000';
        ctx.fillRect(padding - 3, p3Y - 3, p3W + 6, p3H + 6);
        ctx.drawImage(images[2], padding, p3Y, p3W, p3H);

        // Subtle border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 2;
        ctx.strokeRect(1, 1, 1078, 1078);
      }

      // 转换为 blob 并下载
      canvas.toBlob((blob) => {
        if (!blob) {
          toast({
            title: "Error",
            description: "Failed to create image",
            variant: "destructive",
          });
          return;
        }

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dreamcard-${projectId || 'export'}-${ratio}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast({
          title: "Download Complete",
          description: `Your dream card (${ratio}) has been downloaded`,
        });
      }, 'image/png', 0.95);

    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download Failed",
        description: "Please try again or contact support",
        variant: "destructive",
      });
    }
  };

  const handleShare = (platform: string) => {
    toast({
      title: "Coming Soon",
      description: `${platform} sharing will be available soon`,
    });
  };

  const handleGoHome = () => {
    router.push('/');
  };

  const handleCreateNew = () => {
    router.push('/');
  };

  return (
    <div className="space-y-4">
      {/* Navigation Buttons */}
      <div className="flex gap-3">
        <Button
          onClick={handleGoHome}
          className="flex-1 rounded-xl"
          variant="default"
        >
          <Home className="mr-2 h-4 w-4" />
          Back to Home
        </Button>
        <Button
          onClick={handleCreateNew}
          className="flex-1 rounded-xl"
          variant="default"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Create Another
        </Button>
      </div>

      {/* Download Buttons */}
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={() => handleDownload("9:16")}
          className="flex-1 rounded-xl"
          variant="outline"
        >
          <Download className="mr-2 h-4 w-4" />
          PNG 9:16
        </Button>
        <Button
          onClick={() => handleDownload("1:1")}
          className="flex-1 rounded-xl"
          variant="outline"
        >
          <Download className="mr-2 h-4 w-4" />
          PNG 1:1
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button
          onClick={() => handleShare("Twitter")}
          className="flex-1 rounded-xl"
          variant="secondary"
        >
          <Share2 className="mr-2 h-4 w-4" />
          Twitter
        </Button>
        <Button
          onClick={() => handleShare("Reddit")}
          className="flex-1 rounded-xl"
          variant="secondary"
        >
          <Share2 className="mr-2 h-4 w-4" />
          Reddit
        </Button>
        <Button
          onClick={() => handleShare("Threads")}
          className="flex-1 rounded-xl"
          variant="secondary"
        >
          <Share2 className="mr-2 h-4 w-4" />
          Threads
        </Button>
        <Button
          onClick={() => handleShare("Pinterest")}
          className="flex-1 rounded-xl"
          variant="secondary"
        >
          <Share2 className="mr-2 h-4 w-4" />
          Pinterest
        </Button>
      </div>

      <Button
        onClick={onPrivacyToggle}
        variant="outline"
        className="w-full rounded-xl"
      >
        {isPrivate ? "Make Public" : "Make Private"}
      </Button>
    </div>
  );
}
