import {
  DateRangePreset,
  SearchField,
  SortColumn,
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
 * Parses a sort string into an array of SortColumn objects
 * Format: "field:direction,field:direction" e.g., "createdAt:desc,status:asc"
 * @param sortString - The sort string from search params
 * @param allowedFields - Array of allowed sort fields
 * @param defaultSort - Default sort configuration
 * @returns Array of valid SortColumn objects
 */
export function parseSortColumns(
  sortString: string | undefined | null,
  allowedFields: readonly SortField[],
  defaultSort: SortColumn[] = [
    { field: "createdAt", direction: "desc" },
    { field: "serviceNo", direction: "desc" },
  ]
): SortColumn[] {
  if (!sortString) return defaultSort;

  const sortPairs = sortString.split(",").filter(Boolean);
  const parsedSorts: SortColumn[] = [];

  for (const pair of sortPairs) {
    const [field, direction] = pair.split(":");

    // Validate field
    if (!field || !allowedFields.includes(field as SortField)) {
      continue;
    }

    // Validate direction
    if (direction !== "asc" && direction !== "desc") {
      continue;
    }

    parsedSorts.push({
      field: field as SortField,
      direction: direction as SortDirection,
    });
  }

  // Return default if no valid sorts were parsed
  return parsedSorts.length > 0 ? parsedSorts : defaultSort;
}

/**
 * Parses warranty case filters from search params with safe defaults
 * @param searchParams - The search params object from Next.js
 * @returns WarrantyCaseFilters with guaranteed valid values
 */
export function parseWarrantyCaseFilters(searchParams: {
  search?: string;
  searchField?: string;
  sort?: string;
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

  return {
    search: searchParams.search?.trim() || "",
    searchField: parseStringSafe(
      searchParams.searchField,
      allowedSearchFields,
      "all"
    ),
    sort: parseSortColumns(searchParams.sort, allowedSortFields),
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
