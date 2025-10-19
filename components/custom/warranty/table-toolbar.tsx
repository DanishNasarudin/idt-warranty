"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { WarrantyCaseFilters } from "@/lib/types/search-params";
import { Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { TableSort } from "./table-sort";

const SEARCH_FIELD_OPTIONS = [
  { label: "All Fields", value: "all" as const },
  { label: "Service No", value: "serviceNo" as const },
  { label: "Customer Name", value: "customerName" as const },
  { label: "Contact", value: "customerContact" as const },
  { label: "Email", value: "customerEmail" as const },
];

type TableToolbarProps = {
  filters: WarrantyCaseFilters;
};

export function TableToolbar({ filters }: TableToolbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Local state for optimistic updates (immediate UI feedback)
  const [searchValue, setSearchValue] = useState(filters.search);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync local state when filters change from URL
  useEffect(() => {
    setSearchValue(filters.search);
  }, [filters.search]);

  const updateSearchParams = useCallback(
    (updates: Partial<WarrantyCaseFilters>, immediate = false) => {
      const params = new URLSearchParams(searchParams.toString());

      // Update params
      Object.entries(updates).forEach(([key, value]) => {
        if (value === "" || value === undefined || value === null) {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }
      });

      // Reset to page 1 when filters change (except when changing page)
      if (!updates.page) {
        params.set("page", "1");
      }

      const updateFn = () => {
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
      };

      if (immediate) {
        // Immediate update for non-text inputs (dropdowns, buttons)
        startTransition(updateFn);
      } else {
        // No transition for debounced updates to avoid disabling inputs
        updateFn();
      }
    },
    [pathname, router, searchParams]
  );

  const handleSearchChange = (value: string) => {
    // Update local state immediately for responsive UI
    setSearchValue(value);

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Debounce the server call
    debounceTimerRef.current = setTimeout(() => {
      updateSearchParams({ search: value }, false);
    }, 500); // 500ms debounce delay
  };

  const handleSearchFieldChange = (value: string) => {
    updateSearchParams(
      { searchField: value as WarrantyCaseFilters["searchField"] },
      true
    );
  };

  const handleResetFilters = () => {
    setSearchValue("");
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    startTransition(() => {
      router.push(pathname, { scroll: false });
    });
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const hasActiveFilters = searchValue.trim() !== "";

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          {/* Search Input */}
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search warranty cases..."
              value={searchValue}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-4"
            />
          </div>

          {/* Search Field Filter */}
          <Select
            value={filters.searchField}
            onValueChange={handleSearchFieldChange}
            disabled={isPending}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Search by..." />
            </SelectTrigger>
            <SelectContent>
              {SEARCH_FIELD_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  By: {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Reset Filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleResetFilters}
            title="Clear filters"
            disabled={isPending}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Multi-column Sort */}
      <TableSort sortColumns={filters.sort} />
    </div>
  );
}
