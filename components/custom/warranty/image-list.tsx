"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { FileImage, Loader2, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ImageViewerDialog } from "./image-viewer-dialog";

interface CaseImage {
  id: number;
  fileName: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
  createdAt: Date;
  url: string;
}

interface ImageListProps {
  caseId: number;
  refreshTrigger?: number; // Used to trigger refresh from parent
}

export function ImageList({ caseId, refreshTrigger = 0 }: ImageListProps) {
  const [images, setImages] = useState<CaseImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImageId, setSelectedImageId] = useState<number | null>(null);
  const [deletingImageId, setDeletingImageId] = useState<number | null>(null);

  const loadImages = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/warranty/${caseId}/images`);
      if (!response.ok) {
        throw new Error("Failed to load images");
      }
      const data = await response.json();
      setImages(data.images || []);
    } catch (error) {
      console.error("Error loading images:", error);
      toast.error("Failed to load images");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadImages();
  }, [caseId, refreshTrigger]);

  const handleDelete = async (imageId: number) => {
    setDeletingImageId(imageId);
    try {
      const response = await fetch(`/api/warranty/images/${imageId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete image");
      }

      toast.success("Image deleted successfully");
      setImages((prev) => prev.filter((img) => img.id !== imageId));
    } catch (error) {
      console.error("Error deleting image:", error);
      toast.error("Failed to delete image");
    } finally {
      setDeletingImageId(null);
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="text-sm text-muted-foreground text-center py-4">
        No images uploaded yet
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {images.map((image) => (
          <div
            key={image.id}
            className="group relative border rounded-lg p-3 hover:border-primary/50 transition-colors"
          >
            <button
              onClick={() => setSelectedImageId(image.id)}
              className="w-full text-left space-y-2"
            >
              <div className="flex items-center gap-2">
                <FileImage className="h-5 w-5 text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {image.fileName || `Image ${image.id}`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(image.sizeBytes)}
                  </p>
                </div>
              </div>
            </button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                  disabled={deletingImageId === image.id}
                >
                  {deletingImageId === image.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 text-destructive" />
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Image</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete{" "}
                    <strong>{image.fileName || "this image"}</strong>? This
                    action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleDelete(image.id)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        ))}
      </div>

      {selectedImageId && (
        <ImageViewerDialog
          open={selectedImageId !== null}
          onOpenChange={(open) => !open && setSelectedImageId(null)}
          imageId={selectedImageId}
          fileName={
            images.find((img) => img.id === selectedImageId)?.fileName ||
            undefined
          }
        />
      )}
    </>
  );
}
