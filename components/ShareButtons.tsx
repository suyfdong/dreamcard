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
        // MANGA/COMIC DYNAMIC LAYOUT for 9:16
        // Inspired by manga panels: angled, overlapping, with depth
        canvas.width = 1080;
        canvas.height = 1920;

        // Dark atmospheric background
        const bgGradient = ctx.createRadialGradient(540, 960, 0, 540, 960, 1200);
        bgGradient.addColorStop(0, '#1a1a2e');
        bgGradient.addColorStop(1, '#0a0a0a');
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, 1080, 1920);

        // Add subtle noise texture to background
        ctx.globalAlpha = 0.03;
        for (let i = 0; i < 5000; i++) {
          const x = Math.random() * 1080;
          const y = Math.random() * 1920;
          ctx.fillStyle = Math.random() > 0.5 ? '#fff' : '#000';
          ctx.fillRect(x, y, 1, 1);
        }
        ctx.globalAlpha = 1;

        // PANEL 1: Top-left, slightly rotated (dynamic energy)
        ctx.save();
        ctx.translate(100, 100);
        ctx.rotate(-2 * Math.PI / 180); // -2 degrees tilt

        // Shadow for depth
        ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
        ctx.shadowBlur = 30;
        ctx.shadowOffsetX = 10;
        ctx.shadowOffsetY = 10;

        // White border (manga style)
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-8, -8, 500 + 16, 650 + 16);

        // Image
        ctx.shadowColor = 'transparent';
        ctx.drawImage(images[0], 0, 0, 500, 650);
        ctx.restore();

        // PANEL 2: Right side, rotated opposite direction (tension)
        ctx.save();
        ctx.translate(580, 400);
        ctx.rotate(1.5 * Math.PI / 180); // +1.5 degrees tilt

        ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
        ctx.shadowBlur = 35;
        ctx.shadowOffsetX = -8;
        ctx.shadowOffsetY = 12;

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-8, -8, 480 + 16, 620 + 16);

        ctx.shadowColor = 'transparent';
        ctx.drawImage(images[1], 0, 0, 480, 620);
        ctx.restore();

        // PANEL 3: Bottom center, larger (climax emphasis)
        ctx.save();
        ctx.translate(180, 1180);
        ctx.rotate(-1 * Math.PI / 180); // -1 degree tilt

        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 40;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 15;

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-10, -10, 720 + 20, 680 + 20);

        ctx.shadowColor = 'transparent';
        ctx.drawImage(images[2], 0, 0, 720, 680);
        ctx.restore();

        // Optional: Add comic-style speed lines for drama (subtle)
        ctx.globalAlpha = 0.08;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        for (let i = 0; i < 15; i++) {
          const angle = (i / 15) * Math.PI * 2;
          const x1 = 540 + Math.cos(angle) * 300;
          const y1 = 960 + Math.sin(angle) * 500;
          const x2 = 540 + Math.cos(angle) * 600;
          const y2 = 960 + Math.sin(angle) * 1000;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;

      } else {
        // 1:1 MANGA LAYOUT (Instagram post)
        canvas.width = 1080;
        canvas.height = 1080;

        // Atmospheric background
        const bgGradient = ctx.createRadialGradient(540, 540, 0, 540, 540, 800);
        bgGradient.addColorStop(0, '#1a1a2e');
        bgGradient.addColorStop(1, '#0a0a0a');
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, 1080, 1080);

        // Noise texture
        ctx.globalAlpha = 0.03;
        for (let i = 0; i < 3000; i++) {
          ctx.fillStyle = Math.random() > 0.5 ? '#fff' : '#000';
          ctx.fillRect(Math.random() * 1080, Math.random() * 1080, 1, 1);
        }
        ctx.globalAlpha = 1;

        // PANEL 1: Top-left diagonal cut
        ctx.save();
        ctx.translate(80, 80);
        ctx.rotate(-1.5 * Math.PI / 180);

        ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
        ctx.shadowBlur = 25;
        ctx.shadowOffsetX = 8;
        ctx.shadowOffsetY = 8;

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-6, -6, 480 + 12, 480 + 12);

        ctx.shadowColor = 'transparent';
        ctx.drawImage(images[0], 0, 0, 480, 480);
        ctx.restore();

        // PANEL 2: Top-right, overlapping slightly
        ctx.save();
        ctx.translate(570, 60);
        ctx.rotate(1 * Math.PI / 180);

        ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
        ctx.shadowBlur = 28;
        ctx.shadowOffsetX = -6;
        ctx.shadowOffsetY = 10;

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-6, -6, 440 + 12, 440 + 12);

        ctx.shadowColor = 'transparent';
        ctx.drawImage(images[1], 0, 0, 440, 440);
        ctx.restore();

        // PANEL 3: Bottom, wider for climax
        ctx.save();
        ctx.translate(140, 590);
        ctx.rotate(-0.5 * Math.PI / 180);

        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 35;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 12;

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-8, -8, 800 + 16, 420 + 16);

        ctx.shadowColor = 'transparent';
        ctx.drawImage(images[2], 0, 0, 800, 420);
        ctx.restore();

        // Subtle radial speed lines
        ctx.globalAlpha = 0.06;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 12; i++) {
          const angle = (i / 12) * Math.PI * 2;
          ctx.beginPath();
          ctx.moveTo(540 + Math.cos(angle) * 200, 540 + Math.sin(angle) * 200);
          ctx.lineTo(540 + Math.cos(angle) * 600, 540 + Math.sin(angle) * 600);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
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
