export type SearchField =
  | "all"
  | "serviceNo"
  | "customerName"
  | "customerContact"
  | "customerEmail";

export type SortField =
  | "createdAt"
  | "updatedAt"
  | "serviceNo"
  | "customerName"
  | "status";

export type SortDirection = "asc" | "desc";

export type SortColumn = {
  field: SortField;
  direction: SortDirection;
};

export type DateRangePreset = "all" | "lastWeek" | "lastMonth" | "custom";

export type DateRangeFilter = {
  preset: DateRangePreset;
  startDate?: string; // ISO string
  endDate?: string; // ISO string
};

export type WarrantyCaseFilters = {
  search: string;
  searchField: SearchField;
  sort: SortColumn[]; // Support multiple sort columns
  page: number;
  limit: number;
};

export type DashboardFilters = {
  dateRange: DateRangeFilter;
};
