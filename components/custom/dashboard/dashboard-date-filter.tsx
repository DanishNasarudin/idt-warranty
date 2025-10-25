"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateRangePreset } from "@/lib/types/search-params";
import { cn } from "@/lib/utils";
import { parseDateRangePreset } from "@/lib/utils/search-params";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { DateRange } from "react-day-picker";

const presetOptions: { value: DateRangePreset; label: string }[] = [
  { value: "all", label: "All Time" },
  { value: "lastWeek", label: "Last 7 Days" },
  { value: "lastMonth", label: "Last 30 Days" },
  { value: "custom", label: "Custom Range" },
];

export function DashboardDateFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get current values from URL with safe defaults
  const currentPreset = parseDateRangePreset(
    searchParams?.get("preset") ?? undefined
  );
  const currentStartDate = searchParams?.get("startDate") || undefined;
  const currentEndDate = searchParams?.get("endDate") || undefined;

  const [preset, setPreset] = useState<DateRangePreset>(currentPreset);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    if (currentStartDate && currentEndDate) {
      return {
        from: new Date(currentStartDate),
        to: new Date(currentEndDate),
      };
    }
    return undefined;
  });

  const updateURL = useCallback(
    (
      newPreset: DateRangePreset,
      newStartDate?: string,
      newEndDate?: string
    ) => {
      const params = new URLSearchParams(searchParams?.toString() ?? "");

      params.set("preset", newPreset);

      if (newStartDate) {
        params.set("startDate", newStartDate);
      } else {
        params.delete("startDate");
      }

      if (newEndDate) {
        params.set("endDate", newEndDate);
      } else {
        params.delete("endDate");
      }

      router.push(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const handlePresetChange = (value: DateRangePreset) => {
    setPreset(value);

    if (value !== "custom") {
      // Clear custom date range when selecting a preset
      setDateRange(undefined);
      updateURL(value);
    }
  };

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);

    if (range?.from && range?.to) {
      updateURL("custom", range.from.toISOString(), range.to.toISOString());
    }
  };

  return (
    <div className="flex items-center gap-3">
      <Select value={preset} onValueChange={handlePresetChange}>
        <SelectTrigger className="w-min">
          <SelectValue placeholder="Select period" />
        </SelectTrigger>
        <SelectContent>
          {presetOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {preset === "custom" && (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-min justify-start text-left font-normal",
                !dateRange && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, "dd/MM/yyyy")} -{" "}
                    {format(dateRange.to, "dd/MM/yyyy")}
                  </>
                ) : (
                  format(dateRange.from, "dd/MM/yyyy")
                )
              ) : (
                <span>Pick a date range</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange?.from}
              selected={dateRange}
              onSelect={handleDateRangeChange}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
