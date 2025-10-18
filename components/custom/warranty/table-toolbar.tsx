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
import { useWarrantyCaseStore } from "@/lib/stores/warranty-case-store";
import { ArrowDownAZ, ArrowUpAZ, Search, X } from "lucide-react";

const SEARCH_FIELD_OPTIONS = [
  { label: "All Fields", value: "all" as const },
  { label: "Service No", value: "serviceNo" as const },
  { label: "Customer Name", value: "customerName" as const },
  { label: "Contact", value: "customerContact" as const },
  { label: "Email", value: "customerEmail" as const },
];

const SORT_FIELD_OPTIONS = [
  { label: "Date Created", value: "createdAt" as const },
  { label: "Last Updated", value: "updatedAt" as const },
  { label: "Service No", value: "serviceNo" as const },
  { label: "Customer Name", value: "customerName" as const },
  { label: "Status", value: "status" as const },
];

export function TableToolbar() {
  const {
    searchQuery,
    searchField,
    sortField,
    sortDirection,
    setSearchQuery,
    setSearchField,
    setSortField,
    setSortDirection,
    resetFilters,
    getFilteredCases,
  } = useWarrantyCaseStore();

  const filteredCount = getFilteredCases().length;
  const hasActiveFilters = searchQuery.trim() !== "";

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
        {/* Search Input */}
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search warranty cases..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>

        {/* Search Field Filter */}
        <Select value={searchField} onValueChange={setSearchField}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Search by..." />
          </SelectTrigger>
          <SelectContent>
            {SEARCH_FIELD_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        {/* Sort Field */}
        <Select value={sortField} onValueChange={setSortField}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Sort by..." />
          </SelectTrigger>
          <SelectContent>
            {SORT_FIELD_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sort Direction Toggle */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => setSortDirection(sortDirection === "asc" ? "desc" : "asc")}
          title={sortDirection === "asc" ? "Sort ascending" : "Sort descending"}
        >
          {sortDirection === "asc" ? (
            <ArrowUpAZ className="h-4 w-4" />
          ) : (
            <ArrowDownAZ className="h-4 w-4" />
          )}
        </Button>

        {/* Reset Filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="icon"
            onClick={resetFilters}
            title="Clear filters"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Results Count */}
      {hasActiveFilters && (
        <div className="text-sm text-muted-foreground">
          {filteredCount} {filteredCount === 1 ? "result" : "results"}
        </div>
      )}
    </div>
  );
}
