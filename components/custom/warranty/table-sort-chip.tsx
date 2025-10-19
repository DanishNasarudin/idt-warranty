"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { SortDirection, SortField } from "@/lib/types/search-params";
import { cn } from "@/lib/utils";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronsDown, ChevronsUp, X } from "lucide-react";
import { useState } from "react";

type SortChipProps = {
  field: SortField;
  label: string;
  direction: SortDirection;
  onToggleDirection: () => void;
  onRemove: () => void;
  disabled?: boolean;
  isDragging?: boolean;
};

export function SortChip({
  field,
  label,
  direction,
  onToggleDirection,
  onRemove,
  disabled = false,
  isDragging = false,
}: SortChipProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: field,
    disabled: disabled || isMenuOpen,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  const isActuallyDragging = isDragging || isSortableDragging;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center rounded-md border border-border bg-background",
        "shadow-sm transition-shadow hover:shadow-md",
        isActuallyDragging && "opacity-50 shadow-lg"
      )}
    >
      {/* Draggable Label */}
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "h-6 cursor-grab whitespace-nowrap rounded-r-none border-r text-xs font-normal active:cursor-grabbing",
          "hover:bg-accent/50",
          disabled && "cursor-not-allowed opacity-50"
        )}
        {...(!isMenuOpen && listeners)}
        {...attributes}
        disabled={disabled}
      >
        {label}
      </Button>

      {/* Direction & Remove Menu */}
      <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn("h-6 rounded-l-none px-2", "hover:bg-accent/50")}
            disabled={disabled}
          >
            {direction === "asc" ? (
              <ChevronsUp className="h-4 w-4" />
            ) : (
              <ChevronsDown className="h-4 w-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuRadioGroup
            value={`${direction}`}
            onValueChange={(value) => {
              if (value === "remove") {
                onRemove();
              } else {
                onToggleDirection();
              }
              setIsMenuOpen(false);
            }}
          >
            <DropdownMenuRadioItem value="asc" className="justify-between">
              Ascending
              <ChevronsUp className="ml-2 h-4 w-4" />
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="desc" className="justify-between">
              Descending
              <ChevronsDown className="ml-2 h-4 w-4" />
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem
              value="remove"
              className="justify-between text-destructive"
            >
              Remove
              <X className="ml-2 h-4 w-4" />
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
