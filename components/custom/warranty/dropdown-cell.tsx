"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { ChevronDown, X } from "lucide-react";

type DropdownOption = {
  label: string;
  value: string | number | boolean;
};

type DropdownCellProps = {
  value: string | number | boolean | null;
  options: DropdownOption[];
  onSelect: (value: string | number | boolean | null) => void;
  allowNull?: boolean;
  className?: string;
  getDisplayValue?: (value: string | number | boolean | null) => string;
  renderValue?: (value: string | number | boolean | null) => React.ReactNode;
};

export function DropdownCell({
  value,
  options,
  onSelect,
  allowNull = true,
  className,
  getDisplayValue,
  renderValue,
}: DropdownCellProps) {
  const displayValue = getDisplayValue
    ? getDisplayValue(value)
    : value?.toString() || "Not set";

  const renderedValue = renderValue ? renderValue(value) : null;

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(null);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "h-full w-full justify-between px-3 hover:bg-accent/50 font-normal",
            value === null && "text-muted-foreground italic",
            className
          )}
        >
          <span className="truncate flex items-center gap-2">
            {renderedValue || displayValue}
          </span>
          <div className="flex items-center gap-1">
            {allowNull && value !== null && (
              <X
                className="h-3 w-3 hover:text-destructive"
                onClick={handleClear}
              />
            )}
            <ChevronDown className="h-4 w-4" />
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        {allowNull && (
          <DropdownMenuItem
            onClick={() => onSelect(null)}
            className="text-muted-foreground italic"
          >
            None
          </DropdownMenuItem>
        )}
        {options.map((option, index) => (
          <DropdownMenuItem
            key={index}
            onClick={() => onSelect(option.value)}
            className={cn(value === option.value && "bg-accent font-medium")}
          >
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
