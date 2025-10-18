"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Download, Loader2, X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

interface ImageViewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageId: number;
  fileName?: string;
}

export function ImageViewerDialog({
  open,
  onOpenChange,
  imageId,
  fileName = "image",
}: ImageViewerDialogProps) {
  const [isLoading, setIsLoading] = useState(true);
  const imageUrl = `/api/warranty/images/${imageId}`;

  const handleDownload = async () => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName || `image-${imageId}.webp`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading image:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-4xl max-h-[90vh] overflow-hidden p-0 block"
        showCloseButton={false}
      >
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="truncate">{fileName}</DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDownload}
                title="Download image"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        <div className="relative flex items-center justify-center p-6 pt-2 overflow-hidden max-h-[calc(90vh-5rem)]">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          <div className="relative w-full h-full flex items-center justify-center">
            <Image
              src={imageUrl}
              alt={fileName}
              width={1200}
              height={800}
              className="max-w-full w-full h-auto object-contain!"
              onLoadingComplete={() => setIsLoading(false)}
              unoptimized // Since we're serving from our own API
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
