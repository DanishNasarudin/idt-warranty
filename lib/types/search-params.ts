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

export type WarrantyCaseFilters = {
  search: string;
  searchField: SearchField;
  sortBy: SortField;
  sortDirection: SortDirection;
  page: number;
  limit: number;
};
