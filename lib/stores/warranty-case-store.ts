"use client";

import { StaffOption, WarrantyCaseWithRelations } from "@/lib/types/warranty";
import { create } from "zustand";

type EditingCell = {
  caseId: number;
  field: string;
};

type WarrantyCaseStore = {
  cases: WarrantyCaseWithRelations[];
  staffOptions: StaffOption[];
  expandedRows: Set<number>;
  editingCell: EditingCell | null;

  // Actions
  setCases: (cases: WarrantyCaseWithRelations[]) => void;
  setStaffOptions: (staff: StaffOption[]) => void;
  updateCase: (
    caseId: number,
    updates: Partial<WarrantyCaseWithRelations>
  ) => void;
  toggleRowExpansion: (caseId: number) => void;
  setEditingCell: (cell: EditingCell | null) => void;

  // Socket.io preparation - will be used for real-time updates
  handleRemoteUpdate: (
    caseId: number,
    updates: Partial<WarrantyCaseWithRelations>
  ) => void;
};

export const useWarrantyCaseStore = create<WarrantyCaseStore>((set) => ({
  cases: [],
  staffOptions: [],
  expandedRows: new Set(),
  editingCell: null,

  setCases: (cases) => set({ cases }),

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

  // This will be called when receiving socket.io updates from other users
  handleRemoteUpdate: (caseId, updates) =>
    set((state) => ({
      cases: state.cases.map((c) =>
        c.id === caseId ? { ...c, ...updates } : c
      ),
    })),
}));
