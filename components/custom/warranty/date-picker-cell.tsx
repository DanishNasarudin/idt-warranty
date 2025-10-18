"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Lock } from "lucide-react";
import { memo, useState } from "react";

type DatePickerCellProps = {
  value: Date | string | null;
  onSave: (value: Date) => void;
  isLocked?: boolean;
  lockedBy?: string;
  placeholder?: string;
};

function DatePickerCellComponent({
  value,
  onSave,
  isLocked = false,
  lockedBy,
  placeholder = "Pick a date",
}: DatePickerCellProps) {
  const [open, setOpen] = useState(false);

  // Convert string to Date if needed
  const dateValue = value ? new Date(value) : undefined;

  const handleSelect = (date: Date | undefined) => {
    if (date && !isLocked) {
      onSave(date);
      setOpen(false);
    }
  };

  const buttonContent = (
    <Button
      variant="ghost"
      className={cn(
        "w-full justify-start text-left font-normal h-auto py-1 px-0",
        !dateValue && "text-muted-foreground",
        isLocked && "cursor-not-allowed opacity-70 bg-muted/50"
      )}
      disabled={isLocked}
    >
      {/* <CalendarIcon className="mr-2 h-4 w-4" /> */}
      {dateValue ? format(dateValue, "dd/MM/yyyy") : <span>{placeholder}</span>}
      {isLocked && <Lock className="ml-auto h-3 w-3 text-muted-foreground" />}
    </Button>
  );

  if (isLocked && lockedBy) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{buttonContent}</TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">Currently being edited by {lockedBy}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{buttonContent}</PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={dateValue}
          onSelect={handleSelect}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

// Memoize to prevent unnecessary re-renders
export const DatePickerCell = memo(
  DatePickerCellComponent,
  (prevProps, nextProps) => {
    // Convert dates to comparable values
    const prevDate = prevProps.value
      ? new Date(prevProps.value).getTime()
      : null;
    const nextDate = nextProps.value
      ? new Date(nextProps.value).getTime()
      : null;

    return (
      prevDate === nextDate &&
      prevProps.isLocked === nextProps.isLocked &&
      prevProps.lockedBy === nextProps.lockedBy &&
      prevProps.placeholder === nextProps.placeholder
    );
  }
);

DatePickerCell.displayName = "DatePickerCell";
