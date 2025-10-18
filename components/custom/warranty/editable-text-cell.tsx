"use client";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

type EditableTextCellProps = {
  value: string | null;
  onSave: (value: string) => void;
  isEditing: boolean;
  onEditStart: () => void;
  onEditEnd: () => void;
  className?: string;
};

export function EditableTextCell({
  value,
  onSave,
  isEditing,
  onEditStart,
  onEditEnd,
  className,
}: EditableTextCellProps) {
  const [localValue, setLocalValue] = useState(value || "");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setLocalValue(value || "");
  }, [value]);

  const handleBlur = () => {
    if (localValue !== (value || "")) {
      onSave(localValue);
    }
    onEditEnd();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleBlur();
    } else if (e.key === "Escape") {
      setLocalValue(value || "");
      onEditEnd();
    }
  };

  if (isEditing) {
    return (
      <Input
        ref={inputRef}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={cn("h-8 border-primary px-1", className)}
      />
    );
  }

  return (
    <div
      onClick={onEditStart}
      className={cn(
        "h-full w-full cursor-pointer hover:bg-accent/50 transition-colors rounded-sm",
        className
      )}
    >
      {value || <span className="text-muted-foreground italic">Empty</span>}
    </div>
  );
}
