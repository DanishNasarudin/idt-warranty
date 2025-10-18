"use client";

import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Lock } from "lucide-react";
import { memo, useEffect, useRef, useState } from "react";

type EditableTextCellProps = {
  value: string | null;
  onSave: (value: string) => void;
  isEditing: boolean;
  onEditStart: () => void;
  onEditEnd: () => void;
  className?: string;
  isLocked?: boolean;
  lockedBy?: string;
};

function EditableTextCellComponent({
  value,
  onSave,
  isEditing,
  onEditStart,
  onEditEnd,
  className,
  isLocked = false,
  lockedBy,
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
    // Only update local value if not currently editing
    if (!isEditing) {
      setLocalValue(value || "");
    }
  }, [value, isEditing]);

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

  const handleClick = () => {
    if (!isLocked) {
      onEditStart();
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
        disabled={isLocked}
      />
    );
  }

  const cellContent = (
    <button
      onClick={handleClick}
      disabled={isLocked}
      className={cn(
        "h-full w-full rounded-sm transition-colors relative text-left py-1",
        isLocked
          ? "cursor-not-allowed bg-muted/50"
          : "cursor-pointer hover:bg-accent/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
        className
      )}
    >
      <div className="flex items-center gap-1 h-full">
        {isLocked && (
          <Lock className="h-3 w-3 text-muted-foreground shrink-0" />
        )}
        <span className={cn(isLocked && "text-muted-foreground")}>
          {value || <span className="italic text-muted-foreground">Empty</span>}
        </span>
      </div>
    </button>
  );

  if (isLocked && lockedBy) {
    return (
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>{cellContent}</TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            <p>Locked by {lockedBy}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return cellContent;
}

// Memoize to prevent unnecessary re-renders
export const EditableTextCell = memo(
  EditableTextCellComponent,
  (prevProps, nextProps) => {
    return (
      prevProps.value === nextProps.value &&
      prevProps.isEditing === nextProps.isEditing &&
      prevProps.isLocked === nextProps.isLocked &&
      prevProps.lockedBy === nextProps.lockedBy &&
      prevProps.className === nextProps.className
    );
  }
);

EditableTextCell.displayName = "EditableTextCell";
