"use client";

import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { ChevronDown, X } from "lucide-react";
import { useState } from "react";

type DropdownOption = {
  label: string;
  value: string | number | boolean;
  className?: string;
};

type DropdownCellProps = {
  value: string | number | boolean | null;
  options: DropdownOption[];
  onSelect: (value: string | number | boolean | null) => void;
  allowNull?: boolean;
  className?: string;
  getDisplayValue?: (value: string | number | boolean | null) => string;
  getBadgeClassName?: (value: string | number | boolean | null) => string;
  renderValue?: (value: string | number | boolean | null) => React.ReactNode;
};

export function DropdownCell({
  value,
  options,
  onSelect,
  allowNull = true,
  className,
  getDisplayValue,
  getBadgeClassName,
  renderValue,
}: DropdownCellProps) {
  const [open, setOpen] = useState(false);
  
  const displayValue = getDisplayValue
    ? getDisplayValue(value)
    : value?.toString() || "Not set";

  const renderedValue = renderValue ? renderValue(value) : null;
  const badgeClassName = getBadgeClassName ? getBadgeClassName(value) : "";

  const handleClear = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect(null);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "h-full w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md transition-colors",
            "hover:bg-accent/50",
            className
          )}
          onPointerDown={(e) => {
            // Check if the click is on the X button
            const target = e.target as HTMLElement;
            if (target.closest('[data-clear-button]')) {
              e.preventDefault();
            }
          }}
        >
          <div className="flex items-center gap-2">
            <Badge
              className={cn(
                "cursor-pointer transition-all",
                value === null &&
                  "bg-secondary/50 text-secondary-foreground/70 border-secondary/20",
                badgeClassName
              )}
            >
              <span className="truncate flex items-center gap-1.5">
                {renderedValue || displayValue}
              </span>
              <div className="flex items-center gap-0.5 ml-1">
                {allowNull && value !== null && (
                  <span
                    data-clear-button
                    onClick={handleClear}
                    className="inline-flex items-center justify-center cursor-pointer"
                  >
                    <X className="h-3 w-3 hover:text-destructive transition-colors" />
                  </span>
                )}
                <ChevronDown className="h-3 w-3" />
              </div>
            </Badge>
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48 p-1">
        {allowNull && (
          <DropdownMenuItem
            onClick={() => onSelect(null)}
            className="text-muted-foreground italic"
          >
            <Badge className="bg-secondary/50 text-secondary-foreground/70 border-secondary/20 w-full justify-center">
              None
            </Badge>
          </DropdownMenuItem>
        )}
        {options.map((option, index) => (
          <DropdownMenuItem
            key={index}
            onClick={() => onSelect(option.value)}
            className={cn(value === option.value && "bg-accent/50")}
          >
            <Badge
              className={cn(
                "w-full justify-center transition-all",
                option.className,
                value === option.value && "ring-2 ring-ring/20"
              )}
            >
              {option.label}
            </Badge>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
