import {
  DateRangePreset,
  SearchField,
  SortDirection,
  SortField,
  WarrantyCaseFilters,
} from "@/lib/types/search-params";

/**
 * Safely parses an integer from a string with a fallback default value.
 * Ensures the result is always a valid positive integer.
 * @param value - The string value to parse
 * @param defaultValue - The default value to return if parsing fails
 * @param min - Minimum allowed value (default: 1)
 * @returns A valid positive integer
 */
export function parseIntSafe(
  value: string | undefined | null,
  defaultValue: number,
  min: number = 1
): number {
  if (!value) return defaultValue;

  const parsed = parseInt(value, 10);

  if (isNaN(parsed) || parsed < min) {
    return defaultValue;
  }

  return parsed;
}

/**
 * Safely parses a string value with validation against allowed values.
 * @param value - The string value to parse
 * @param allowedValues - Array of allowed string values
 * @param defaultValue - The default value to return if validation fails
 * @returns A valid string from allowedValues
 */
export function parseStringSafe<T extends string>(
  value: string | undefined | null,
  allowedValues: readonly T[],
  defaultValue: T
): T {
  if (!value) return defaultValue;

  if (allowedValues.includes(value as T)) {
    return value as T;
  }

  return defaultValue;
}

/**
 * Parses warranty case filters from search params with safe defaults
 * @param searchParams - The search params object from Next.js
 * @returns WarrantyCaseFilters with guaranteed valid values
 */
export function parseWarrantyCaseFilters(searchParams: {
  search?: string;
  searchField?: string;
  sortBy?: string;
  sortDirection?: string;
  page?: string;
  limit?: string;
}): WarrantyCaseFilters {
  const allowedSearchFields: SearchField[] = [
    "all",
    "serviceNo",
    "customerName",
    "customerContact",
    "customerEmail",
  ];

  const allowedSortFields: SortField[] = [
    "createdAt",
    "updatedAt",
    "serviceNo",
    "customerName",
    "status",
  ];

  const allowedSortDirections: SortDirection[] = ["asc", "desc"];

  return {
    search: searchParams.search?.trim() || "",
    searchField: parseStringSafe(
      searchParams.searchField,
      allowedSearchFields,
      "all"
    ),
    sortBy: parseStringSafe(
      searchParams.sortBy,
      allowedSortFields,
      "createdAt"
    ),
    sortDirection: parseStringSafe(
      searchParams.sortDirection,
      allowedSortDirections,
      "desc"
    ),
    page: parseIntSafe(searchParams.page, 1, 1),
    limit: parseIntSafe(searchParams.limit, 10, 1),
  };
}

/**
 * Parses pagination parameters with safe defaults
 * @param searchParams - The search params object
 * @param defaultPage - Default page number (default: 1)
 * @param defaultLimit - Default limit (default: 50)
 * @returns Object with page and limit
 */
export function parsePaginationParams(
  searchParams: {
    page?: string;
    limit?: string;
  },
  defaultPage: number = 1,
  defaultLimit: number = 50
): { page: number; limit: number } {
  return {
    page: parseIntSafe(searchParams.page, defaultPage, 1),
    limit: parseIntSafe(searchParams.limit, defaultLimit, 1),
  };
}

/**
 * Parses date range preset with safe default
 * @param value - The preset value from search params
 * @returns Valid DateRangePreset
 */
export function parseDateRangePreset(
  value: string | undefined | null
): DateRangePreset {
  const allowedPresets: DateRangePreset[] = [
    "all",
    "lastWeek",
    "lastMonth",
    "custom",
  ];

  return parseStringSafe(value, allowedPresets, "all");
}
