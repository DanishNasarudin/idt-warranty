"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useWarrantyCaseStore } from "@/lib/stores/warranty-case-store";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

const ROWS_PER_PAGE_OPTIONS = [10, 20, 50, 100];

export function TablePagination() {
  const {
    currentPage,
    rowsPerPage,
    setCurrentPage,
    setRowsPerPage,
    getTotalPages,
    getSortedCases,
    getPaginatedCases,
  } = useWarrantyCaseStore();

  const totalPages = getTotalPages();
  const totalItems = getSortedCases().length;
  const paginatedCases = getPaginatedCases();

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const endItem = Math.min(currentPage * rowsPerPage, totalItems);

  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  const handleFirstPage = () => setCurrentPage(1);
  const handlePreviousPage = () => setCurrentPage(Math.max(1, currentPage - 1));
  const handleNextPage = () =>
    setCurrentPage(Math.min(totalPages, currentPage + 1));
  const handleLastPage = () => setCurrentPage(totalPages);

  return (
    <div className="flex flex-col items-center justify-between gap-4 px-2 py-4 sm:flex-row">
      {/* Rows per page selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Rows per page:</span>
        <Select
          value={rowsPerPage.toString()}
          onValueChange={(value) => setRowsPerPage(parseInt(value))}
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
        {totalItems === 0 ? (
          "No items"
        ) : (
          <>
            Showing {startItem} to {endItem} of {totalItems} items
          </>
        )}
      </div>

      {/* Pagination controls */}
      <div className="flex items-center gap-2">
        <div className="text-sm text-muted-foreground">
          Page {totalPages === 0 ? 0 : currentPage} of {totalPages}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={handleFirstPage}
            disabled={!canGoPrevious}
            title="First page"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handlePreviousPage}
            disabled={!canGoPrevious}
            title="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleNextPage}
            disabled={!canGoNext}
            title="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleLastPage}
            disabled={!canGoNext}
            title="Last page"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
