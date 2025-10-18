"use client";

import { cn } from "@/lib/utils";
import { ImagePlus, Loader2 } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";

interface ImageUploadProps {
  caseId: number;
  onUploadComplete?: (imageId: number) => void;
  disabled?: boolean;
}

export function ImageUpload({
  caseId,
  onUploadComplete,
  disabled = false,
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async (file: File) => {
    // Validate file type
    const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast.error("Invalid file type. Only PNG, JPEG, and WebP are allowed.");
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error("File size too large. Maximum size is 10MB.");
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`/api/warranty/${caseId}/images`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to upload image");
      }

      const data = await response.json();
      toast.success("Image uploaded successfully");

      if (onUploadComplete && data.image) {
        onUploadComplete(data.image.id);
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
    // Reset input value to allow uploading the same file again
    event.target.value = "";
  };

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled && !isUploading) {
        setIsDragging(true);
      }
    },
    [disabled, isUploading]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (disabled || isUploading) return;

      const file = e.dataTransfer.files[0];
      if (file) {
        handleUpload(file);
      }
    },
    [disabled, isUploading]
  );

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "relative border-2 border-dashed rounded-lg p-6 transition-colors",
        isDragging && "border-primary bg-primary/5",
        !isDragging && "border-muted-foreground/25",
        disabled && "opacity-50 cursor-not-allowed",
        !disabled && "cursor-pointer hover:border-primary/50"
      )}
    >
      <input
        type="file"
        id={`image-upload-${caseId}`}
        accept="image/png,image/jpeg,image/jpg,image/webp"
        onChange={handleFileSelect}
        disabled={disabled || isUploading}
        className="sr-only"
      />

      <label
        htmlFor={`image-upload-${caseId}`}
        className={cn(
          "flex flex-col items-center justify-center gap-2 text-sm text-muted-foreground",
          !disabled && "cursor-pointer"
        )}
      >
        {isUploading ? (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span>Uploading...</span>
          </>
        ) : (
          <>
            <ImagePlus className="h-8 w-8" />
            <span className="font-medium">
              {isDragging
                ? "Drop image here"
                : "Click to upload or drag and drop"}
            </span>
            <span className="text-xs">PNG, JPEG, or WebP (max 10MB)</span>
          </>
        )}
      </label>
    </div>
  );
}
