"use client";

import { StaffOption, WarrantyCaseWithRelations } from "@/lib/types/warranty";
import { create } from "zustand";

type EditingCell = {
  caseId: number;
  field: string;
};

type SearchField =
  | "all"
  | "serviceNo"
  | "customerName"
  | "customerContact"
  | "customerEmail";

type SortField =
  | "createdAt"
  | "serviceNo"
  | "customerName"
  | "status"
  | "updatedAt";

type SortDirection = "asc" | "desc";

type WarrantyCaseStore = {
  cases: WarrantyCaseWithRelations[];
  staffOptions: StaffOption[];
  expandedRows: Set<number>;
  editingCell: EditingCell | null;

  // Search, Filter, Sort, Pagination state
  searchQuery: string;
  searchField: SearchField;
  sortField: SortField;
  sortDirection: SortDirection;
  currentPage: number;
  rowsPerPage: number;

  // Actions
  setCases: (cases: WarrantyCaseWithRelations[]) => void;
  setStaffOptions: (staff: StaffOption[]) => void;
  updateCase: (
    caseId: number,
    updates: Partial<WarrantyCaseWithRelations>
  ) => void;
  toggleRowExpansion: (caseId: number) => void;
  setEditingCell: (cell: EditingCell | null) => void;

  // Search, Filter, Sort, Pagination actions
  setSearchQuery: (query: string) => void;
  setSearchField: (field: SearchField) => void;
  setSortField: (field: SortField) => void;
  setSortDirection: (direction: SortDirection) => void;
  setCurrentPage: (page: number) => void;
  setRowsPerPage: (rows: number) => void;
  resetFilters: () => void;

  // Computed getters
  getFilteredCases: () => WarrantyCaseWithRelations[];
  getSortedCases: () => WarrantyCaseWithRelations[];
  getPaginatedCases: () => WarrantyCaseWithRelations[];
  getTotalPages: () => number;

  // Socket.io preparation - will be used for real-time updates
  handleRemoteUpdate: (
    caseId: number,
    updates: Partial<WarrantyCaseWithRelations>
  ) => void;
};

export const useWarrantyCaseStore = create<WarrantyCaseStore>((set, get) => ({
  cases: [],
  staffOptions: [],
  expandedRows: new Set(),
  editingCell: null,

  // Search, Filter, Sort, Pagination initial state
  searchQuery: "",
  searchField: "all",
  sortField: "createdAt",
  sortDirection: "desc",
  currentPage: 1,
  rowsPerPage: 20,

  setCases: (cases) => set({ cases, currentPage: 1 }),

  setStaffOptions: (staff) => set({ staffOptions: staff }),

  updateCase: (caseId, updates) =>
    set((state) => ({
      cases: state.cases.map((c) =>
        c.id === caseId ? { ...c, ...updates } : c
      ),
    })),

  toggleRowExpansion: (caseId) =>
    set((state) => {
      const newExpandedRows = new Set(state.expandedRows);
      if (newExpandedRows.has(caseId)) {
        newExpandedRows.delete(caseId);
      } else {
        newExpandedRows.add(caseId);
      }
      return { expandedRows: newExpandedRows };
    }),

  setEditingCell: (cell) => set({ editingCell: cell }),

  // Search, Filter, Sort, Pagination actions
  setSearchQuery: (query) => set({ searchQuery: query, currentPage: 1 }),

  setSearchField: (field) => set({ searchField: field, currentPage: 1 }),

  setSortField: (field) =>
    set((state) => ({
      sortField: field,
      // Toggle direction if clicking same field, otherwise default to desc
      sortDirection:
        state.sortField === field
          ? state.sortDirection === "asc"
            ? "desc"
            : "asc"
          : "desc",
      currentPage: 1,
    })),

  setSortDirection: (direction) => set({ sortDirection: direction }),

  setCurrentPage: (page) => set({ currentPage: page }),

  setRowsPerPage: (rows) => set({ rowsPerPage: rows, currentPage: 1 }),

  resetFilters: () =>
    set({
      searchQuery: "",
      searchField: "all",
      sortField: "createdAt",
      sortDirection: "desc",
      currentPage: 1,
      rowsPerPage: 20,
    }),

  // Computed getters
  getFilteredCases: () => {
    const state = get();
    const { cases, searchQuery, searchField } = state;

    if (!searchQuery.trim()) return cases;

    const query = searchQuery.toLowerCase().trim();

    return cases.filter((case_) => {
      switch (searchField) {
        case "serviceNo":
          return case_.serviceNo.toLowerCase().includes(query);
        case "customerName":
          return case_.customerName?.toLowerCase().includes(query) || false;
        case "customerContact":
          return case_.customerContact?.toLowerCase().includes(query) || false;
        case "customerEmail":
          return case_.customerEmail?.toLowerCase().includes(query) || false;
        case "all":
        default:
          return (
            case_.serviceNo.toLowerCase().includes(query) ||
            case_.customerName?.toLowerCase().includes(query) ||
            case_.customerContact?.toLowerCase().includes(query) ||
            case_.customerEmail?.toLowerCase().includes(query) ||
            false
          );
      }
    });
  },

  getSortedCases: () => {
    const state = get();
    const { sortField, sortDirection } = state;
    const filtered = state.getFilteredCases();

    return [...filtered].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case "createdAt":
        case "updatedAt":
          aValue = new Date(a[sortField]).getTime();
          bValue = new Date(b[sortField]).getTime();
          break;
        case "serviceNo":
          aValue = a.serviceNo.toLowerCase();
          bValue = b.serviceNo.toLowerCase();
          break;
        case "customerName":
          aValue = a.customerName?.toLowerCase() || "";
          bValue = b.customerName?.toLowerCase() || "";
          break;
        case "status":
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  },

  getPaginatedCases: () => {
    const state = get();
    const { currentPage, rowsPerPage } = state;
    const sorted = state.getSortedCases();

    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;

    return sorted.slice(startIndex, endIndex);
  },

  getTotalPages: () => {
    const state = get();
    const sorted = state.getSortedCases();
    return Math.ceil(sorted.length / state.rowsPerPage);
  },

  // This will be called when receiving socket.io updates from other users
  handleRemoteUpdate: (caseId, updates) =>
    set((state) => ({
      cases: state.cases.map((c) =>
        c.id === caseId ? { ...c, ...updates } : c
      ),
    })),
}));
