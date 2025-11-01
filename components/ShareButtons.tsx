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

export function ShareButtons({ aspectRatio, isPrivate, onPrivacyToggle, panels, projectId }: ShareButtonsProps) {
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
      // Create canvas for合成图片
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas not supported');

      // 设置画布尺寸
      const panelWidth = 768;
      const panelHeight = 1024;

      if (ratio === "9:16") {
        // 三张图横向排列
        canvas.width = panelWidth * 3;
        canvas.height = panelHeight;
      } else {
        // 1:1 正方形，三张图纵向排列
        canvas.width = panelWidth;
        canvas.height = panelHeight * 3;
      }

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

      for (let i = 0; i < panels.length; i++) {
        const img = await loadImage(panels[i].imageUrl);

        if (ratio === "9:16") {
          // 横向排列
          ctx.drawImage(img, i * panelWidth, 0, panelWidth, panelHeight);
        } else {
          // 纵向排列
          ctx.drawImage(img, 0, i * panelHeight, panelWidth, panelHeight);
        }
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
