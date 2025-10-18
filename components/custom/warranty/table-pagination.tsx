"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WarrantyCaseFilters } from "@/lib/types/search-params";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";

const ROWS_PER_PAGE_OPTIONS = [10, 20, 50, 100];

type TablePaginationProps = {
  filters: WarrantyCaseFilters;
  totalCases: number;
};

export function TablePagination({ filters, totalCases }: TablePaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const totalPages = Math.ceil(totalCases / filters.limit);
  const startItem =
    totalCases === 0 ? 0 : (filters.page - 1) * filters.limit + 1;
  const endItem = Math.min(filters.page * filters.limit, totalCases);

  const canGoPrevious = filters.page > 1;
  const canGoNext = filters.page < totalPages;

  const updatePage = useCallback(
    (page: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", String(page));

      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
      });
    },
    [pathname, router, searchParams]
  );

  const updateLimit = useCallback(
    (limit: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("limit", String(limit));
      params.set("page", "1"); // Reset to first page when changing limit

      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
      });
    },
    [pathname, router, searchParams]
  );

  const handleFirstPage = () => updatePage(1);
  const handlePreviousPage = () => updatePage(Math.max(1, filters.page - 1));
  const handleNextPage = () =>
    updatePage(Math.min(totalPages, filters.page + 1));
  const handleLastPage = () => updatePage(totalPages);

  return (
    <div className="flex flex-col items-center justify-between gap-4 px-2 py-4 sm:flex-row">
      {/* Rows per page selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Rows per page:</span>
        <Select
          value={filters.limit.toString()}
          onValueChange={(value) => updateLimit(parseInt(value))}
          disabled={isPending}
        >
          <SelectTrigger className="w-[80px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ROWS_PER_PAGE_OPTIONS.map((option) => (
              <SelectItem key={option} value={option.toString()}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Item count */}
      <div className="text-sm text-muted-foreground">
        {totalCases === 0 ? (
          "No items"
        ) : (
          <>
            Showing {startItem} to {endItem} of {totalCases} items
          </>
        )}
      </div>

      {/* Pagination controls */}
      <div className="flex items-center gap-2">
        <div className="text-sm text-muted-foreground">
          Page {totalPages === 0 ? 0 : filters.page} of {totalPages}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={handleFirstPage}
            disabled={!canGoPrevious || isPending}
            title="First page"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handlePreviousPage}
            disabled={!canGoPrevious || isPending}
            title="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleNextPage}
            disabled={!canGoNext || isPending}
            title="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleLastPage}
            disabled={!canGoNext || isPending}
            title="Last page"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
